import sys
import os
import json

# Fix permissions issue running as node user
os.environ["COMPOSIO_CACHE_DIR"] = "/tmp/.composio"

from composio import Composio, Action

def main():
    # Authenticate to Composio
    api_key = os.environ.get("COMPOSIO_API_KEY", "ak_hEQBw2gcqKcmtfLeeXw3")
    
    try:
        client = Composio(api_key=api_key)
        
        # We assume the user has already connected Gmail. 
        # By default get_entity("default") uses the user's default connection if it exists.
        entity = client.get_entity("default")
        
        # Execute the GMAIL_FETCH_EMAILS action
        # Looking up the Composio documentation, the standard action is fetch_emails.
        # We do not pass arguments to just get the latest default emails.
        action_result = entity.execute(
            action=Action.GMAIL_FETCH_EMAILS,
            params={"max_results": 5}  # Just fetch the top 5 to avoid token bloat
        )
        
        if action_result.get("error"):
             print(f"Error fetching emails: {action_result.get('error')}")
             print("If this is an auth error, you may need to use composio-oauth to connect gmail again.")
             sys.exit(1)
             
        print("\n=== GMAIL FETCH SUCCESS ===")
        print(json.dumps(action_result, indent=2))
        print("============================\n")
        
    except Exception as e:
        print(f"Error executing Composio Action GMAIL_FETCH_EMAILS: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
