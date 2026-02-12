import { describe, it, expect, vi } from 'vitest';
import { supabase, setSupabaseIdentity } from '../../backend/supabase/supabaseClient';

// Mocking auth to simulate a logged-in user
const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com'
};

describe('Supabase Upload Reproduction', () => {
    it('should successfully set identity and upload a file', async () => {
        const uid = mockUser.uid;

        // 1. Set Identity
        console.log('Setting identity for:', uid);
        const { error: identityError } = await setSupabaseIdentity(uid);

        // If this fails, RLS won't know who we are
        if (identityError) {
            console.error('Identity Error:', identityError);
        }
        expect(identityError).toBeNull();

        // 2. Prepare mock file
        const content = 'test data ' + Date.now();
        const fileName = `test-upload-${Date.now()}.csv`;
        const filePath = `datasets/${uid}/${fileName}`;
        const blob = new Blob([content], { type: 'text/csv' });
        const file = new File([blob], fileName, { type: 'text/csv' });

        // 3. Upload to Storage
        console.log('Uploading to storage:', filePath);
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('datasets')
            .upload(filePath, file, {
                upsert: false,
                contentType: 'text/csv'
            });

        if (uploadError) {
            console.error('Upload Error:', uploadError);
        }
        expect(uploadError).toBeNull();
        expect(uploadData).toBeDefined();

        // 4. Insert Metadata
        console.log('Inserting metadata for:', fileName);
        const { error: dbError } = await supabase
            .from('datasets')
            .insert({
                user_id: uid,
                name: fileName,
                url: `https://mock-url.com/${filePath}`,
                row_count: 1,
                column_count: 1,
                quality_score: 100,
                grade: 'A',
                domain: 'General',
                method: 'Manual Upload',
                file_size: content.length,
                status: 'Ready',
                storage_path: filePath
            });

        if (dbError) {
            console.error('DB Error:', dbError);
        }
        expect(dbError).toBeNull();
    });
});
