import secrets
api_key = secrets.token_hex(32)  # Generate a 64-character API key
print(api_key)