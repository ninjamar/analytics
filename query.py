import json
import jmespath
from cloudflare import Cloudflare
from decouple import config

client = Cloudflare(
    api_email=config("API_EMAIL"),
    api_token=config("API_TOKEN"),
    api_key=config("API_KEY")
)


result = client.d1.database.query(
    config("DATABASE_ID"), # prod-analytics-v1
    account_identifier=config("ACCOUNT_ID"),
    sql="SELECT * FROM analytics"
)

print(jmespath.search("", result.results))
print(result)