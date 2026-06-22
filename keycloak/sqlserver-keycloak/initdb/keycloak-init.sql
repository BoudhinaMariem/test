IF DB_ID(N'KeycloakTriweb') IS NULL
BEGIN
    CREATE DATABASE KeycloakTriweb;
END;
GO

USE KeycloakTriweb;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.sql_logins
    WHERE name = N'keycloak_user'
)
BEGIN
    CREATE LOGIN keycloak_user
    WITH PASSWORD = 'Keycloak@12345';
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.database_principals
    WHERE name = N'keycloak_user'
)
BEGIN
    CREATE USER keycloak_user FOR LOGIN keycloak_user;
END;
GO

ALTER ROLE db_owner ADD MEMBER keycloak_user;
GO