import supabase
from supabase import Client, PostgrestAPIResponse

class SupabaseService:
    def __init__(self, url: str, key: str):
        self.client: Client = supabase.create_client(url, key)

    def get_user_profile(self, user_id: str):
        """Fetches a user profile by user_id."""
        response: PostgrestAPIResponse = self.client.table('profiles').select('*').eq('id', user_id).execute()
        if response.data:
            return response.data[0]
        return None

    def increment_upload_count(self, user_id: str):
        """Increments the upload count for a user."""
        profile = self.get_user_profile(user_id)
        if profile:
            current_uploads = profile.get('upload_count', 0)
            new_uploads = current_uploads + 1
            response = self.client.table('profiles').update({'upload_count': new_uploads}).eq('id', user_id).execute()
            return response
        return None

    def get_user_by_token(self, jwt: str):
        """Gets user information from a JWT."""
        response = self.client.auth.get_user(jwt)
        return response.user

    def upload_pdf(self, file_id: str, file_bytes: bytes, bucket: str = "pdfs", content_type: str = "application/pdf") -> str | None:
        """Upload PDF bytes to Supabase Storage and return a signed URL (valid 7 days)."""
        file_path = f"{file_id}.pdf"
        # Upsert to allow overwriting same key if necessary
        try:
            # Supabase Storage expects header values to be strings. Passing the boolean True
            # for "upsert" causes "Header value must be str or bytes". Convert it to "true".
            file_options = {"content-type": content_type, "upsert": "true"}
            self.client.storage.from_(bucket).upload(
                file_path,
                file_bytes,
                file_options,
            )
        except Exception as e:
            print(f"[Supabase upload] FAILED for {bucket}/{file_path}: {e}")
            raise
        # Generate a signed URL valid for 7 days (604800 seconds)
        signed_url_resp = self.client.storage.from_(bucket).create_signed_url(file_path, 604800)

        # The Supabase Python client historically returned different key casings depending on version.
        # Newer versions use "signedURL", while earlier ones used "signed_url".
        # In addition, some variants wrap the result inside a "data" key.  Handle all cases defensively.

        url: str | None = None

        if isinstance(signed_url_resp, dict):
            # Direct keys
            url = (
                signed_url_resp.get("signed_url")
                or signed_url_resp.get("signedURL")
                or signed_url_resp.get("signedUrl")
            )

            # Some client versions nest the payload under a "data" field
            if url is None and isinstance(signed_url_resp.get("data"), dict):
                data_dict = signed_url_resp["data"]
                url = (
                    data_dict.get("signed_url")
                    or data_dict.get("signedURL")
                    or data_dict.get("signedUrl")
                )

        # If bucket is public, create_signed_url may return None. Fall back to the regular public URL.
        if url is None:
            try:
                url = self.client.storage.from_(bucket).get_public_url(file_path)
            except Exception as e:
                # Log but continue returning None so caller can decide.
                print(f"SupabaseService: failed to get public URL for {file_path}: {e}")

        return url 