from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import  (
    computed_field,
    AnyUrl
)
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True
    )
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Gitlytix"
    CLICKHOUSE_USER: str = "default"
    CLICKHOUSE_PASSWORD: str = "default"
    CLICKHOUSE_HOST: str = "localhost"
    CLICKHOUSE_PORT: int = 9000
    CLICKHOUSE_DB: str = "default"
    @computed_field  # type: ignore[prop-decorator]
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> AnyUrl:
        return AnyUrl.build(
            scheme="clickhouse+native",
            username=self.CLICKHOUSE_USER,
            password=self.CLICKHOUSE_PASSWORD,
            host=self.CLICKHOUSE_HOST,
            port=self.CLICKHOUSE_PORT,
            path=self.CLICKHOUSE_DB,
        )

settings = Settings()
