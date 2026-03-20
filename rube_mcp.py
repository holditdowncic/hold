import sys
import json
import subprocess
import os

RUBE_URL = "https://rube.app/mcp"

def send_rpc(method, params=None):
    token = os.environ.get("RUBE_TOKEN", "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ1c2VyXzAxS0o3MFhUQzBEMjJSREQwTTU2R044SEJUIiwib3JnSWQiOiJvcmdfMDFLSjcwWFdTTktBMTRCQVo0OTZQMkhYNlEiLCJpYXQiOjE3NzE5MDk4ODJ9.U5RHHvcdI0TTc9BL0ESbUsDlf5nn0TOPi4Qurpj1xlU")
    
    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "id": "1"
    }
    if params:
        payload["params"] = params

    data = json.dumps(payload)
    
    cmd = [
        "curl", "-s", "-X", "POST",
        "-H", f"Authorization: Bearer {token}",
        "-H", "Accept: application/json, text/event-stream",
        "-H", "Content-Type: application/json",
        "-H", "User-Agent: curl/8.14.1",
        "-d", data,
        RUBE_URL
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        res_body = result.stdout.strip()
        if not res_body:
            print("Error: Empty response from Rube")
            sys.exit(1)
            
        # The NextJS MCP Server wraps its POST responses in SSE "data: {}" format automatically
        # to satisfy the "Accept: text/event-stream" requirement.
        json_str = res_body
        for line in res_body.splitlines():
            if line.startswith("data: "):
                json_str = line[6:]
                break

        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            print(f"RAW BODY:\n{res_body}\n")
            sys.exit(1)
            
    except subprocess.CalledProcessError as e:
        print(f"cURL returned error code {e.returncode}")
        print(f"STDERR: {e.stderr}")
        sys.exit(1)
    except Exception as e:
        print(f"Error executing cURL: {e}")
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("Usage: python rube_mcp.py <list_tools|call_tool> [tool_name] [kwargs_json]")
        sys.exit(1)

    command = sys.argv[1]

    if command == "list_tools":
        res = send_rpc("tools/list")
        if "error" in res:
            print("Error:", res["error"])
            sys.exit(1)
            
        tools = res.get("result", {}).get("tools", [])
        print("=== AVAILABLE RUBE TOOLS ===")
        for t in tools:
            print(f"Tool: {t.get('name')}")
            print(f"Description: {t.get('description', '')}")
            print(f"Schema: {json.dumps(t.get('inputSchema', {}))}")
            print("---")
            
    elif command == "call_tool":
        if len(sys.argv) < 3:
            print("Usage: python rube_mcp.py call_tool <tool_name> [kwargs_json]")
            sys.exit(1)
            
        tool_name = sys.argv[2]
        kwargs_json = sys.argv[3] if len(sys.argv) > 3 else "{}"
        
        try:
            kwargs = json.loads(kwargs_json)
        except json.JSONDecodeError:
            print(f"Error: Invalid JSON arguments: {kwargs_json}")
            sys.exit(1)
            
        print(f"Calling Tool: {tool_name} with params {kwargs_json}...")
        res = send_rpc("tools/call", {
            "name": tool_name,
            "arguments": kwargs
        })
        
        if "error" in res:
            print("RPC Error Returned:")
            print(json.dumps(res["error"], indent=2))
        else:
            print("Result:")
            content = res.get("result", {}).get("content", [])
            for item in content:
                if item.get("type") == "text":
                    print(item.get("text"))
                else:
                    print(f"[{item.get('type')} content]")

if __name__ == "__main__":
    main()
