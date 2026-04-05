# Supabase 設置說明

## 大頭照功能設置

### 1. 創建 Storage Bucket

在 Supabase 控制台中：

1. 進入 **Storage** 頁面
2. 點擊 **Create bucket**
3. Bucket 名稱：`icc_avatar`
4. 設置為 **Public bucket**（公開讀取）

### 2. 設置 Bucket 權限

在 `icc_avatar` bucket 中：

1. 進入 **Policies** 標籤
2. 創建以下政策：

#### 允許已認證用戶上傳檔案
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'icc_avatar'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 允許公開讀取檔案
```sql
-- Allow public read access to avatar files
CREATE POLICY "Avatar files are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'icc_avatar');
```

#### 允許用戶更新自己的檔案
```sql
-- Allow users to update their own avatar files
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'icc_avatar'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 允許用戶刪除自己的檔案
```sql
-- Allow users to delete their own avatar files
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'icc_avatar'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 3. 用戶資料存儲說明

用戶資料（包括 `avatar_path`）存儲在 Supabase Auth 的 `user_metadata` 中：

- **name**: 用戶名稱
- **role**: 用戶角色
- **department**: 學系
- **student_id**: 學號
- **join_date**: 加入日期
- **total_meditation**: 總禪定時數
- **monthly_checkins**: 本月打卡次數
- **avatar_path**: 大頭照檔案路徑

### 4. 測試功能

設置完成後：

1. 確保用戶已登入
2. 進入個人資料頁面
3. 點擊大頭照區域
4. 選擇圖片檔案（小於 3MB）
5. 等待上傳完成

如果遇到權限錯誤，請檢查上述政策是否正確設置。