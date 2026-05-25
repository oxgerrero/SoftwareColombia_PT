from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    # Database
    database_url: str

    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    selection_token_expire_minutes: int = 15

    # CORS – stored as a comma-separated string, exposed as a list
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
