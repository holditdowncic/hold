-- ============================================
-- HOLD CMS — Seed Data (current hardcoded content)
-- ============================================

-- Hero section
INSERT INTO site_content (section, content) VALUES ('hero', '{
  "badge": "Community Interest Company — Croydon, UK",
  "heading_line1": "I Can Because",
  "heading_line2": "You Can.",
  "heading_line3": "And Together, We Can.",
  "subtitle": "Hold It Down CIC supports young people aged 12–25 and older adults through creative, wellbeing, and intergenerational programmes across South London.",
  "subtitle2": "We create safe, culturally rooted spaces where people can express themselves, build confidence, and connect across generations.",
  "image": "/media/roots/roots-24.jpeg",
  "image_alt": "Hold It Down CIC members gathered around a table in matching blue hoodies",
  "cta_primary_text": "Explore Our Programmes",
  "cta_primary_link": "#programs",
  "cta_secondary_text": "Support Our Work",
  "cta_secondary_link": "#support"
}');

-- About section
INSERT INTO site_content (section, content) VALUES ('about', '{
  "callout_title": "Intergenerational at our core",
  "callout_text": "Intergenerational work is central to our approach, bringing young people and older adults together to learn, create and strengthen community connections.",
  "image": "/media/image-2.jpeg",
  "image_alt": "Hold It Down CIC banner - I Can Because You Can",
  "badge_year": "Est. 2022",
  "badge_location": "Croydon, South London",
  "section_label": "Who We Are",
  "heading": "Culturally rooted, community driven",
  "paragraphs": [
    "Hold It Down Community Interest Company (CIC) is a Croydon-based organisation that creates culturally rooted, intergenerational spaces to build emotional wellbeing, confidence and connection across families and communities.",
    "Our work combines sport, creative expression, dialogue and mentorship to strengthen relationships, promote positive identity and support long-term resilience. We work with children, young people, parents, fathers, carers and elders.",
    "Our work is rooted in trust, co-production, and accessibility. We activate familiar community spaces to make engagement feel safe, inclusive, and relevant — designing projects with and for the people we serve, particularly young people from Black and minoritised backgrounds."
  ],
  "focus_areas": [
    {"icon": "🧠", "text": "Emotional literacy & wellbeing"},
    {"icon": "💪", "text": "Positive masculinity & male role modelling"},
    {"icon": "🤝", "text": "Intergenerational connection & cohesion"},
    {"icon": "🏠", "text": "Safe, inclusive spaces for healing"}
  ]
}');

-- CTA section
INSERT INTO site_content (section, content) VALUES ('cta', '{
  "heading": "Ready to be part of the movement?",
  "description": "Whether you''re a young person looking for a safe space, a family seeking community, or someone who wants to support grassroots change — we want to hear from you.",
  "buttons": [
    {"text": "Join a Programme", "link": "#programs"},
    {"text": "Volunteer With Us", "link": "#contact"},
    {"text": "Partner With Us", "link": "#contact"},
    {"text": "Support Our Work", "link": "#support", "primary": true}
  ]
}');

-- Contact section
INSERT INTO site_content (section, content) VALUES ('contact', '{
  "section_label": "Get In Touch",
  "heading": "Let''s connect",
  "description": "We''d love to hear from you. Whether you want to join a programme, volunteer, partner with us, or just learn more — reach out.",
  "items": [
    {"label": "Email", "value": "hollditdownuk@hotmail.com", "href": "mailto:hollditdownuk@hotmail.com", "icon": "email"},
    {"label": "Instagram", "value": "@holditdowncic", "href": "https://www.instagram.com/holditdowncic", "icon": "instagram"},
    {"label": "Location", "value": "Thornton Heath, Croydon CR7 8QY", "href": null, "icon": "location"}
  ]
}');

-- Support section
INSERT INTO site_content (section, content) VALUES ('support', '{
  "section_label": "Support Us",
  "heading": "Support Hold It Down",
  "description": "Your support helps us deliver free and accessible creative, wellbeing and intergenerational programmes across South London.",
  "ways": [
    {"icon": "heart", "title": "Donate", "desc": "Support workshops, materials and safe spaces for young people and families."},
    {"icon": "people", "title": "Partner With Us", "desc": "Collaborate with Hold It Down to strengthen impact across South London communities."},
    {"icon": "flag", "title": "Volunteer", "desc": "Share your time, skills or lived experience to support our programmes."},
    {"icon": "briefcase", "title": "In-kind Support", "desc": "Contribute space, equipment or professional expertise to empower our work."}
  ],
  "cta_text": "Get in touch to support our work"
}');

-- Gallery video info
INSERT INTO site_content (section, content) VALUES ('gallery', '{
  "section_label": "Gallery",
  "heading": "Moments that matter",
  "description": "Highlights from our community events — real families, real connections, real impact.",
  "video_src": "/media/video-1.mp4",
  "video_poster": "/media/image-10.jpeg",
  "video_caption": "Watch highlights from our Roots & Wings Family Fun Day 2025"
}');

-- Programmes section header
INSERT INTO site_content (section, content) VALUES ('programs', '{
  "section_label": "Our Programmes",
  "heading_prefix": "Designed to",
  "heading_highlight1": "inspire, connect",
  "heading_mid": "and",
  "heading_highlight2": "empower",
  "description": "Each project responds directly to the needs of our community, giving young people and families the tools to grow in confidence, creativity, and resilience.",
  "flagship_label": "Flagship Programme",
  "flagship_title": "Roots & Wings",
  "flagship_desc": "A celebration of fatherhood, family, and intergenerational connection. Roots & Wings brings fathers, children, and families together through sports, workshops, and shared experiences that strengthen bonds and create lasting memories.",
  "flagship_desc2": "It''s about planting roots of love and giving wings of confidence to future generations. The programme now forms the foundation for longer-term intergenerational and male mentorship work across Croydon.",
  "flagship_image": "/media/roots/roots-2.jpeg",
  "flagship_image_alt": "Families and children at the Roots & Wings Family Fun Day",
  "flagship_tags": ["Fatherhood", "Intergenerational", "Family Unity", "Wellbeing"]
}');

-- Team members
INSERT INTO team_members (name, role, sort_order) VALUES
('Marcus Jack', 'Director, Communications & Programme Lead', 1),
('Laverne John', 'Director, Creative Lead', 2);

-- Gallery images
INSERT INTO gallery_images (src, alt, caption, sort_order) VALUES
('/media/roots/roots-1.jpeg', 'Roots & Wings volunteers group photo', 'Our Team', 1),
('/media/roots/roots-2.jpeg', 'Families and children at the fun day activities', 'Family Fun Day', 2),
('/media/roots/roots-3.jpeg', 'Young person proudly wearing their medal', 'Celebrating Achievement', 3),
('/media/roots/roots-7.jpeg', 'Face painting station at Roots & Wings event', 'Creative Activities', 4),
('/media/image-5.jpeg', 'Family enjoying the Roots & Wings Family Fun Day', 'Families Together', 5),
('/media/roots/roots-10.jpeg', 'Dancing and celebrating at the community event', 'Dance & Performance', 6),
('/media/image-7.jpeg', 'Child proudly showing their medal', 'Award Winners', 7),
('/media/roots/roots-5.jpeg', 'Fathers and mentors at outdoor discussion', 'Men''s Discussion', 8),
('/media/talkdi/talkdi-1.jpeg', 'Talk Di TingZ youth podcast team', 'Talk Di TingZ', 9),
('/media/roots/roots-12.jpeg', 'Young people playing football in the park', 'Sports & Football', 10),
('/media/image-3.jpeg', 'Community members showcasing children''s books', 'Community Partners', 11),
('/media/roots/roots-22.jpeg', 'Creative crafts and activities by young people', 'Creative Workshops', 12);

-- Programmes
INSERT INTO programs (title, description, tags, image_url, image_alt, is_flagship, sort_order) VALUES
('Echoes of Us', 'A powerful journey for fathers, sons, and mentors. Explores masculinity, emotions, and the bonds that unite generations through workshops, open conversations, and creative activities.', ARRAY['Fathers & Sons', 'Mentorship', 'Masculinity'], '/media/roots/roots-5.jpeg', 'Fathers and mentors at outdoor discussion session', false, 1),
('Voices Together', 'Using storytelling, creativity, and performance to give young people a platform to be heard. Develops leadership, communication, and digital media skills while celebrating identity.', ARRAY['Storytelling', 'Leadership', 'Digital Media'], '/media/roots/roots-15.jpeg', 'Community members gathering for storytelling and performances', false, 2),
('Talk Di TingZ', 'Our youth-led podcast offering a safe space for young people to discuss real issues — identity, relationships, and emotional wellbeing. Building a culture of openness where young people lead the conversation.', ARRAY['Youth Podcast', 'Safe Space', 'Identity'], '/media/talkdi/talkdi-1.jpeg', 'Talk Di TingZ youth podcast team', false, 3),
('Our Voices, Our Stage', 'A platform for advocacy, performance, and youth leadership. From spoken word to performance showcases, equipping young people with the tools to inspire audiences and influence change.', ARRAY['Spoken Word', 'Performance', 'Advocacy'], '/media/roots/roots-10.jpeg', 'Young people performing and celebrating at community event', false, 4);

-- Other initiatives
INSERT INTO initiatives (title, detail, sort_order) VALUES
('Mentoring', 'One-to-one and group support (10–17 years)', 1),
('Entrepreneurship', 'Work experience & career pathways (14–17 years)', 2),
('Workshops & Retreats', 'Life skills, wellbeing & personal growth', 3),
('Sports & Football', 'Teamwork, discipline & confidence', 4),
('Family Support', 'Loving Yourself & The Gents Network', 5);

-- Events
INSERT INTO events (slug, title, date, location, description, highlights, impact, image, image_alt, badge, gallery, sort_order) VALUES
('roots-and-wings-2025', 'Roots & Wings Family Fun Day 2025', '14 June 2025', 'Heavers Farm Primary School, Croydon', 'Approximately 300 people attended, including around 100 fathers and male carers, 100 children and young people aged 5–24, and a wider group of mothers, grandparents, volunteers and community members. The day was filled with father-and-child races, football challenges, dance performances, spoken-word acts, and facilitated men''s discussions on vulnerability and love.', ARRAY['Father-and-child races & traditional family games', 'Football & athletics challenges', 'Dance and spoken-word performances', 'Facilitated men''s discussion on vulnerability and love', 'The Tree of Hope — families reflecting on legacy and the future', 'Face painting and creative activities for children'], ARRAY['Emotional wellbeing & sense of belonging among children', 'Positive male role modelling & visibility of men as carers', 'Strengthened family bonds & community cohesion', 'Increased youth voice & leadership'], '/media/roots/roots-1.jpeg', 'Volunteers and families at the Roots & Wings Family Fun Day', '300+ Attendees', '[{"src":"/media/roots/roots-1.jpeg","alt":"Roots & Wings team group photo"},{"src":"/media/roots/roots-2.jpeg","alt":"Families enjoying the fun day activities"},{"src":"/media/roots/roots-3.jpeg","alt":"Young person with medal"},{"src":"/media/roots/roots-5.jpeg","alt":"Fathers at outdoor discussion"},{"src":"/media/roots/roots-7.jpeg","alt":"Face painting at the event"},{"src":"/media/roots/roots-10.jpeg","alt":"Dancing and performing"},{"src":"/media/image-5.jpeg","alt":"Family at the fun day"},{"src":"/media/image-6.jpeg","alt":"Youth activities"},{"src":"/media/image-7.jpeg","alt":"Child showing medal"},{"src":"/media/image-9.jpeg","alt":"Award ceremony"},{"src":"/media/image-8.jpeg","alt":"Community support"},{"src":"/media/image-3.jpeg","alt":"Community partners"}]', 1),
('talk-di-tingz-2025', 'Talk Di TingZ — Youth Podcast Sessions', 'Ongoing 2025', 'Various community spaces, Croydon', 'A youth-led safe space to discuss identity, relationships, and life issues. Young people lead the conversation, building emotional literacy and driving cultural change through truth-telling and respect. Sessions take place across different community venues in Croydon, bringing together diverse voices.', ARRAY['Youth-led podcast recording sessions', 'Open discussions on identity & relationships', 'Building emotional literacy through dialogue', 'Guest speakers from the community'], ARRAY[]::TEXT[], '/media/talkdi/talkdi-1.jpeg', 'Talk Di TingZ youth podcast team out in the community', 'Youth-Led', '[{"src":"/media/talkdi/talkdi-1.jpeg","alt":"Talk Di TingZ team"}]', 2),
('outdoor-adventures-2024', 'Outdoor Adventure & Team Building', 'Summer 2024', 'Various outdoor centres', 'Young people were taken on outdoor adventure trips designed to build resilience, teamwork and confidence. Activities included high ropes, river crossings, football matches and nature exploration — pushing boundaries in a safe, supported environment.', ARRAY['High ropes & climbing challenges', 'River crossing adventures', 'Football & sports in the park', 'Nature walks and exploration', 'Team-building exercises'], ARRAY['Increased confidence & resilience', 'Stronger peer bonds & teamwork', 'Physical activity & wellbeing'], '/media/roots/roots-20.jpeg', 'Young person on high ropes adventure course', 'Youth Adventure', '[{"src":"/media/roots/roots-20.jpeg","alt":"High ropes adventure"},{"src":"/media/roots/roots-18.jpeg","alt":"River crossing activity"},{"src":"/media/roots/roots-12.jpeg","alt":"Football in the park"}]', 3),
('community-gathering-2024', 'Community Gathering & Networking Night', 'Autumn 2024', 'Alchemy, Croydon', 'An evening gathering bringing together community members, parents, mentors and supporters for networking, sharing stories and building connections. The event celebrated the work done so far and explored next steps for Hold It Down''s mission.', ARRAY['Community networking & connections', 'Story sharing & testimonials', 'Discussion on future programmes', 'Celebrating collective achievements'], ARRAY['Wider community engagement', 'New partnerships & collaborations', 'Increased visibility for Hold It Down CIC'], '/media/roots/roots-15.jpeg', 'Community members gathered for networking evening', 'Community', '[{"src":"/media/roots/roots-15.jpeg","alt":"Community gathering"}]', 4),
('creative-workshops-2024', 'Creative Arts & Wellbeing Workshops', '2024', 'Community spaces, Croydon', 'A series of creative workshops designed to help young people and families express themselves through art, crafts, and creative activities. These sessions provided a calm, inclusive environment for building confidence and promoting emotional wellbeing.', ARRAY['Craft-making & creative arts', 'Wellbeing-focused sessions', 'Inclusive family activities', 'Creative expression & identity exploration'], ARRAY['Improved emotional wellbeing', 'Creative confidence & self-expression', 'Family bonding through shared activities'], '/media/roots/roots-22.jpeg', 'Creative crafts and activities made by participants', 'Wellbeing', '[{"src":"/media/roots/roots-22.jpeg","alt":"Creative workshop outputs"}]', 5);

-- Stats
INSERT INTO stats (label, value, suffix, prefix, duration, sort_order) VALUES
('Incorporated', 2022, '', '', 2000, 1),
('Years of Roots & Wings', 3, 'rd', '', 1200, 2),
('Flagship Programmes', 5, '', '', 1200, 3),
('South London Boroughs', 4, '', '', 1000, 4);
