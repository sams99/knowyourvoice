@@ .. @@
 -- RLS Policies for audio_files
 CREATE POLICY "Users can read own audio files"
   ON audio_files
   FOR SELECT
   TO authenticated
-  USING (auth.uid() = user_id);
+  USING (auth.uid()::text = user_id::text);

 CREATE POLICY "Users can insert own audio files"
   ON audio_files
   FOR INSERT
   TO authenticated
-  WITH CHECK (auth.uid() = user_id);
+  WITH CHECK (auth.uid()::text = user_id::text);

 CREATE POLICY "Users can update own audio files"
   ON audio_files
   FOR UPDATE
   TO authenticated
-  USING (auth.uid() = user_id)
-  WITH CHECK (auth.uid() = user_id);
+  USING (auth.uid()::text = user_id::text)
+  WITH CHECK (auth.uid()::text = user_id::text);

 CREATE POLICY "Users can delete own audio files"
   ON audio_files
   FOR DELETE
   TO authenticated
-  USING (auth.uid() = user_id);
+  USING (auth.uid()::text = user_id::text);