# Vercel環境変数 クイック設定ガイド

## 📋 コピー用環境変数

以下を **Vercel Dashboard > Settings > Environment Variables** に追加：

### 1. OPENAI_API_KEY
```
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
```

### 2. GOOGLE_SPREADSHEET_ID
```
1lQ7rOK01BD5pVTusCEsL0wXq8CIbgjXG_o8QHe_hbp0
```

### 3. GOOGLE_CREDENTIALS（1行で）
```
{"type":"service_account","project_id":"multas-auto-record-system","private_key_id":"4132c92543e2b06bf9fa9b54e9ccca29c8fc9261","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDVVu4X77BPhyZ2\n3mAfo3/mYASm0iZlmBHGSaeTteR5xFpGhp3C4DQkYZRJIYI9tBOBpfpc+fdxrZxF\nliQ6BBd0rbJye++ZJ3gjGpaZliVULfoNpIYwdPiLKb32YaaZTXpypiBGZc3e4q4y\nLo86eIALCT+dtPAQAAHQEW8GkOIbIty/xyeSXBWuscAw49ZHVGVYQd1NNw4T8amz\nYwHOgbwhKrNAvHqnmKxgKHulsGEUX+pD+t4eZ6/k5Oo5jjqOXAQyWx7rsdbiPz5P\nrq7CNbQUl5NloxIo0dUgIAh6g61sz3PUNpMJafItHU+bf0/EBV04K1lO8Pyw0Apv\namvw1Vr9AgMBAAECggEAMlTDcD86m9CZSQL2r5AtvQabIlZC+8XwL5Ux5V3MzNN/\nrtLUhmTJuGmTB9vRc8g3r+ceFXBdqeKZEyu0WUGc3QibqHnH0ZynsbR0okBzhxQf\nwbc2d1kpR/+tkuJ/4PwP7tt1ktYyxyo4iZtFbDiAkNn6ObU1y7iMtO9f/68PwPG+\n1cqBqEKwMOzO3CHjNqjI1esWaMhmnmotOVqge0eQ8Z/daAmZKU3DsxwaW0dZBvIW\nTm5rHgMYc0oaZW9dfAiy9whLe6N8C2wk2dxKYEkC/ADwMGh6JhWf50UHs0f2/G9c\nlTG+UyvwtiY4zWIZNw38IibWviebBZNVMtoEgu1C8QKBgQDtBZv8VeS8ZdlKKQAg\nMzv6rau1PULtGds1rCD+4I/BOXl/tub/Bozq5maf1y7MHSS5LO8SXwfv4B3e3YW8\nkYNzmrt9z8wRKw2l+wXzGt45ey14t4lvMLO3/Ky+3E70YVa1sycCU8vEOPu8FEEU\n2ZRU0pI2Wm33PP0kQTzujnuGSQKBgQDma+N38yc6oH3MDhYKIXDIZuKcywmFvTfl\nhx+sprLV1qZQfYpCkO28xoL9xH5ykC1N6FnUVWmPlRK3WwsvHE9a1/XzSKLDF8LD\nuAqsbZNHfJ1JrA+Tvmk7+mXRmPq6A9ubE5YI4icLMLC/Zz1TfhRK4Vj6mu5ooruh\ntG251eyfFQKBgG8ukGsfh3pwdCr7bJmuLtZ6HO+ZWwmJdXCJ27hzcjt7UGj+TQEX\n+4Y8qasU71jD2vQaBdMiTMDS6nAejZtUzsqtrIFpthnfjjlrtPDCi7d+9meIAKnt\nuH/3wLiO82JjPp9g+E15LT5QVJV3EshK/++CDx/771VogH4/M+vbXkoxAoGBAN6L\nu1HBvdTI51brD+xO6gAUJrCrBRJvc4ozHKuDAVy5CT7aUWwDUCowTJnOaxY5HBiP\n3hrPN7oej8oZm86veBFUXc7QC6uDym9/1Ic++a1ktQFPtmfK0xbDvA1YxGhei37W\nxuTjkDQlnb/vdXKrZewAhBDfDH5xFemTOxrue7AVAoGAE0zxBLUCWi1bxIkInNcS\ndg9gbrE2AF/WUHU2+aiCKLJ/cZJR8SjVLMjBUcXFna9NUlE2EETfesSMxK20Rv57\nActPZ0HOaHmu5fraMpYfAr/ssYR2hUN6mT8hqYDbx1bahkN40mNmOoNiUM1R6nRF\n7ygAWbIVVvljWJ599V6oNkc=\n-----END PRIVATE KEY-----\n","client_email":"multas-v3-data@multas-auto-record-system.iam.gserviceaccount.com","client_id":"116517490310221007775","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/multas-v3-data%40multas-auto-record-system.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
```

## 🚀 設定手順

1. **Vercelダッシュボードを開く**
   - https://vercel.com/cy-sa/multas-v3/settings/environment-variables

2. **各環境変数を追加**
   - Key と Value をコピペ
   - Environment: **Production**, **Preview**, **Development** すべてチェック
   - 「Save」をクリック

3. **再デプロイ**
   ```bash
   cd /Users/kentarotamiya/claude_code_workspace/multas-v2-vercel/github-pages/multas-v3-vercel
   vercel --prod
   ```

## ✅ 動作確認

再デプロイ後、以下を確認：
- https://multas-v3.vercel.app/mobile-input-tabs
- 投稿 → AI分類が動作
- Google Sheets連携が動作

## 📝 補足

- APIキーは本番用です（実習で使用可能）
- Google Sheetsは既に共有設定済み
- 問題があれば新しいAPIキーの発行が必要