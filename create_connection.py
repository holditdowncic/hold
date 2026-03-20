import sys
import os
import argparse

# Fix permissions issue running as node user
os.environ["COMPOSIO_CACHE_DIR"] = "/tmp/.composio"

from composio import Composio

def main():
    parser = argparse.ArgumentParser(description="Create a Composio OAuth connection link.")
    parser.add_argument("integration_name", help="The name of the integration (e.g., facebook, github, slack)")
    args = parser.parse_args()
    
    integration = args.integration_name.lower().strip()
    
    # Authenticate to Composio
    api_key = os.environ.get("COMPOSIO_API_KEY", "ak_hEQBw2gcqKcmtfLeeXw3")
    
    try:
        client = Composio(api_key=api_key)
        entity = client.get_entity("default")
        
        # Request the OAuth payload creation
        request = entity.initiate_connection(app_name=integration, redirect_url="https://app.composio.dev/dashboard")
        
        print("\n=== COMPOSIO OAUTH LINK GENERATED ===")
        print(f"Integration: {integration}")
        print(f"Auth URL: {request.redirectUrl}")
        print("======================================\n")
        print("Please provide this link directly to the user so they can authenticate.")
        
    except Exception as e:
        print(f"Error creating connection for '{integration}': {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
