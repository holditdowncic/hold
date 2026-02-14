import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { commitContentSnapshot } from "@/lib/github";

// Save a snapshot before any mutation for undo support
async function saveHistory(tableName: string, recordId: string, previousData: Record<string, unknown>) {
    if (!supabaseAdmin) return;
    try {
        await supabaseAdmin.from("content_history").insert({
            table_name: tableName,
            record_id: recordId,
            previous_data: previousData,
            action_description: `Updated ${tableName}`,
        });
        // Keep only the last 50 history entries to avoid unbounded growth
        const { data: old } = await supabaseAdmin
            .from("content_history")
            .select("id")
            .order("created_at", { ascending: false })
            .range(50, 1000);
        if (old && old.length > 0) {
            await supabaseAdmin
                .from("content_history")
                .delete()
                .in("id", old.map((r: { id: string }) => r.id));
        }
    } catch (e) {
        console.error("Failed to save history:", e);
    }
}

/**
 * Execute a CMS action directly against Supabase.
 * This is the shared logic used by both the /api/cms route and the Telegram webhook.
 * Returns { success, result?, error? }
 */
export async function executeCMSAction(
    body: Record<string, unknown>
): Promise<{ success: boolean; result?: unknown; error?: string }> {
    if (!supabaseAdmin) {
        return { success: false, error: "Supabase not configured" };
    }

    try {
        const { action } = body;
        let result;

        switch (action) {
            // ─── Section content (JSONB) ───
            case "update_section": {
                const { section, content } = body;
                const { data: prev } = await supabaseAdmin
                    .from("site_content")
                    .select("*")
                    .eq("section", section as string)
                    .single();
                if (prev) await saveHistory("site_content", prev.id, prev);
                const { data, error } = await supabaseAdmin
                    .from("site_content")
                    .update({ content, updated_at: new Date().toISOString() })
                    .eq("section", section as string)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
                break;
            }

            case "update_section_field": {
                const { section, field, value } = body;
                const { data: current, error: fetchErr } = await supabaseAdmin
                    .from("site_content")
                    .select("*")
                    .eq("section", section as string)
                    .single();
                if (fetchErr) throw fetchErr;
                await saveHistory("site_content", current.id, current);
                const updated = { ...current.content, [field as string]: value };
                const { data, error } = await supabaseAdmin
                    .from("site_content")
                    .update({ content: updated, updated_at: new Date().toISOString() })
                    .eq("section", section as string)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
                break;
            }

            // ─── Team Members ───
            case "add_team_member": {
                const { name, role, image_url } = body;
                const { data: maxRow } = await supabaseAdmin
                    .from("team_members")
                    .select("sort_order")
                    .order("sort_order", { ascending: false })
                    .limit(1)
                    .single();
                const nextOrder = (maxRow?.sort_order ?? 0) + 1;
                const { data, error } = await supabaseAdmin
                    .from("team_members")
                    .insert({ name, role, image_url: image_url || null, sort_order: nextOrder })
                    .select()
                    .single();
                if (error) throw error;
                result = data;
                break;
            }

            case "update_team_member": {
                const { name, updates } = body;
                const { data, error } = await supabaseAdmin
                    .from("team_members")
                    .update(updates as Record<string, unknown>)
                    .ilike("name", name as string)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
                break;
            }

            case "remove_team_member": {
                const { name: memberName } = body;
                const { data, error } = await supabaseAdmin
                    .from("team_members")
                    .delete()
                    .ilike("name", memberName as string)
                    .select();
                if (error) throw error;
                result = data;
                break;
            }

            // ─── Gallery Images ───
            case "add_gallery_image": {
                const { src, alt, caption } = body;
                const { data: maxGal } = await supabaseAdmin
                    .from("gallery_images")
                    .select("sort_order")
                    .order("sort_order", { ascending: false })
                    .limit(1)
                    .single();
                const nextGalOrder = (maxGal?.sort_order ?? 0) + 1;
                const { data, error } = await supabaseAdmin
                    .from("gallery_images")
                    .insert({ src, alt: alt || "", caption: caption || "", sort_order: nextGalOrder })
                    .select()
                    .single();
                if (error) throw error;
                result = data;
                break;
            }

            case "remove_gallery_image": {
                const { caption: galCaption } = body;
                const { data, error } = await supabaseAdmin
                    .from("gallery_images")
                    .delete()
                    .ilike("caption", galCaption as string)
                    .select();
                if (error) throw error;
                result = data;
                break;
            }

            // ─── Programs ───
            case "add_program": {
                const { title, description, tags, image_url: progImg, image_alt: progAlt } = body;
                const { data: maxProg } = await supabaseAdmin
                    .from("programs")
                    .select("sort_order")
                    .order("sort_order", { ascending: false })
                    .limit(1)
                    .single();
                const nextProgOrder = (maxProg?.sort_order ?? 0) + 1;
                const { data, error } = await supabaseAdmin
                    .from("programs")
                    .insert({
                        title,
                        description: description || "",
                        tags: tags || [],
                        image_url: progImg || null,
                        image_alt: progAlt || "",
                        sort_order: nextProgOrder,
                    })
                    .select()
                    .single();
                if (error) throw error;
                result = data;
                break;
            }

            case "update_program": {
                const { title: progTitle, updates: progUpdates } = body;
                const { data, error } = await supabaseAdmin
                    .from("programs")
                    .update(progUpdates as Record<string, unknown>)
                    .ilike("title", progTitle as string)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
                break;
            }

            case "remove_program": {
                const { title: rmProgTitle } = body;
                const { data, error } = await supabaseAdmin
                    .from("programs")
                    .delete()
                    .ilike("title", rmProgTitle as string)
                    .select();
                if (error) throw error;
                result = data;
                break;
            }

            // ─── Events ───
            case "add_event": {
                const { event } = body;
                const evt = event as Record<string, string>;
                const { data: maxEvt } = await supabaseAdmin
                    .from("events")
                    .select("sort_order")
                    .order("sort_order", { ascending: false })
                    .limit(1)
                    .single();
                const nextEvtOrder = (maxEvt?.sort_order ?? 0) + 1;
                const slug = (evt.title || "event")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
                const { data, error } = await supabaseAdmin
                    .from("events")
                    .insert({ ...evt, slug, sort_order: nextEvtOrder })
                    .select()
                    .single();
                if (error) throw error;
                result = data;
                break;
            }

            case "update_event": {
                const { slug: evtSlug, updates: evtUpdates } = body;
                const { data, error } = await supabaseAdmin
                    .from("events")
                    .update(evtUpdates as Record<string, unknown>)
                    .eq("slug", evtSlug as string)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
                break;
            }

            // ─── Stats ───
            case "update_stat": {
                const { label: statLabel, value: statValue, suffix: statSuffix, prefix: statPrefix } = body;
                const updateData: Record<string, unknown> = { value: statValue };
                if (statSuffix !== undefined) updateData.suffix = statSuffix;
                if (statPrefix !== undefined) updateData.prefix = statPrefix;
                const { data, error } = await supabaseAdmin
                    .from("stats")
                    .update(updateData)
                    .ilike("label", statLabel as string)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
                break;
            }

            // ─── Initiatives ───
            case "add_initiative": {
                const { title: initTitle, detail: initDetail } = body;
                const { data: maxInit } = await supabaseAdmin
                    .from("initiatives")
                    .select("sort_order")
                    .order("sort_order", { ascending: false })
                    .limit(1)
                    .single();
                const nextInitOrder = (maxInit?.sort_order ?? 0) + 1;
                const { data, error } = await supabaseAdmin
                    .from("initiatives")
                    .insert({ title: initTitle, detail: initDetail || "", sort_order: nextInitOrder })
                    .select()
                    .single();
                if (error) throw error;
                result = data;
                break;
            }

            case "remove_initiative": {
                const { title: rmInitTitle } = body;
                const { data, error } = await supabaseAdmin
                    .from("initiatives")
                    .delete()
                    .ilike("title", rmInitTitle as string)
                    .select();
                if (error) throw error;
                result = data;
                break;
            }

            // ─── Undo / Revert ───
            case "undo": {
                const { data: lastChange, error: histErr } = await supabaseAdmin
                    .from("content_history")
                    .select("*")
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .single();
                if (histErr || !lastChange) {
                    result = { message: "Nothing to undo — no recent changes found." };
                    break;
                }
                const { table_name, record_id, previous_data } = lastChange;
                const { error: restoreErr } = await supabaseAdmin
                    .from(table_name)
                    .update(previous_data)
                    .eq("id", record_id);
                if (restoreErr) throw restoreErr;
                await supabaseAdmin
                    .from("content_history")
                    .delete()
                    .eq("id", lastChange.id);
                result = { message: `Reverted last change to ${table_name} (${previous_data.section || record_id})` };
                break;
            }

            // ─── Status ───
            case "get_status": {
                const tables = ["site_content", "team_members", "gallery_images", "programs", "initiatives", "events", "stats"];
                const counts: Record<string, number> = {};
                for (const table of tables) {
                    const { count } = await supabaseAdmin.from(table).select("*", { count: "exact", head: true });
                    counts[table] = count ?? 0;
                }
                result = counts;
                break;
            }

            default:
                return { success: false, error: `Unknown action: ${action}` };
        }

        // Revalidate the home page and events page
        revalidatePath("/");
        revalidatePath("/events");

        // ─── Commit snapshot to GitHub (triggers Vercel auto-deploy) ───
        try {
            const actionStr = String(action);
            const tableMap: Record<string, string> = {
                update_section: "site_content",
                update_section_field: "site_content",
                add_team_member: "team_members",
                update_team_member: "team_members",
                remove_team_member: "team_members",
                add_gallery_image: "gallery_images",
                remove_gallery_image: "gallery_images",
                add_program: "programs",
                update_program: "programs",
                remove_program: "programs",
                add_event: "events",
                update_event: "events",
                update_stat: "stats",
                add_initiative: "initiatives",
                remove_initiative: "initiatives",
            };

            const tableName = tableMap[actionStr];
            if (tableName && supabaseAdmin) {
                // Fetch full table snapshot
                const { data: snapshot } = await supabaseAdmin
                    .from(tableName)
                    .select("*")
                    .order("id", { ascending: true });

                if (snapshot) {
                    // Build descriptive commit message
                    let desc = actionStr.replace(/_/g, " ");
                    if (body.section) desc += ` (${body.section})`;
                    if (body.field) desc += ` → ${body.field}`;
                    if (body.name) desc += ` → ${body.name}`;
                    if (body.title) desc += ` → ${body.title}`;
                    if (body.slug) desc += ` → ${body.slug}`;
                    if (body.label) desc += ` → ${body.label}`;

                    await commitContentSnapshot(tableName, snapshot, desc);
                }
            }
        } catch (commitErr) {
            // Don't fail the action if GitHub commit fails
            console.error("GitHub commit failed (non-blocking):", commitErr);
        }

        return { success: true, result };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("CMS action error:", message);
        return { success: false, error: message };
    }
}
