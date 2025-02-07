from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True)
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Gitlytix"
    # Default values should match the Docker service configuration
    CLICKHOUSE_USER: str = "default"
    CLICKHOUSE_PASSWORD: str = "default"
    CLICKHOUSE_HOST: str = "clickhouse"  # Changed to Docker service name
    CLICKHOUSE_PORT: int = 8123
    CLICKHOUSE_DB: str = "default"

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Construct the connection string using the Docker service name
        return f"clickhouse+http://{self.CLICKHOUSE_USER}:{self.CLICKHOUSE_PASSWORD}@{self.CLICKHOUSE_HOST}:{self.CLICKHOUSE_PORT}/{self.CLICKHOUSE_DB}"

settings = Settings()