# Resend email setup for ovias.shop

In Hostinger, open the DNS records for ovias.shop and add these records. Do not remove existing website or mailbox records.

| Type | Name | Value | Priority | TTL |
|---|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC/dhe1OrU4htU+43p6k1pByaa3RVKjsn4IxRPN81HPuutmBbmxif0PAS2K6A3q22jo/AU4zfB6/y1VvKdASVGDmr+fdj7E5izvSX0UExhIY3nj0Bml2Bofoxx3h/bk6dAefmgAaV9Oh4P978cB7gFG7p/bNK+MQpdrZo5T+dPfpwIDAQAB` | - | Auto |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 | Auto |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | - | Auto |
| CNAME | `rsend` | `send.forge.rmta.net` | - | 3600 |

Sender: `OVIA <no-reply@ovias.shop>`. After saving the records, use Verify in Resend for ovias.shop. API credentials are saved only in the ignored .env.local file.
