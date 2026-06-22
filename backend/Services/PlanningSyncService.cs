using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Data.SqlClient;

namespace Triweb.Api.Services;

public sealed class PlanningSyncService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PlanningSyncService> _logger;

    public PlanningSyncService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<PlanningSyncService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SyncPlanningAsync(CancellationToken cancellationToken)
    {
        var stopwatch = Stopwatch.StartNew();
        var status = "Success";
        string? error = null;
        var rowCount = 0;

        try
        {
            var apiUrl = _configuration["PlanningApi:Url"];

            if (string.IsNullOrWhiteSpace(apiUrl))
                throw new InvalidOperationException("PlanningApi:Url est manquant.");

            using var response = await _httpClient.GetAsync(apiUrl, cancellationToken);
            response.EnsureSuccessStatusCode();

            var json = await response.Content.ReadAsStringAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(json))
                throw new InvalidOperationException("L'API planification a retourné une réponse vide.");

            rowCount = CountJsonRows(json);

            await SaveRawPlanningAsync(json, cancellationToken);
            await MarkPlanningAsProcessedAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            status = "Failed";
            error = ex.Message;
            _logger.LogError(ex, "Erreur synchronisation API Planification");
        }
        finally
        {
            stopwatch.Stop();

            await InsertSyncLogAsync(
                rowCount,
                status,
                (int)stopwatch.ElapsedMilliseconds,
                error,
                cancellationToken);
        }
    }

    private async Task SaveRawPlanningAsync(string json, CancellationToken cancellationToken)
    {
        var connectionString = _configuration.GetConnectionString("StagingConnection");

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(json));

        await using var command = new SqlCommand("""
            INSERT INTO dbo.planification_api_rawSA
            (
                Payload,
                HashValue,
                DateImport,
                EstTraite
            )
            VALUES
            (
                @Payload,
                @HashValue,
                SYSUTCDATETIME(),
                0
            );
        """, connection);

        command.Parameters.AddWithValue("@Payload", json);
        command.Parameters.Add("@HashValue", System.Data.SqlDbType.VarBinary, 32).Value = hash;

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task MarkPlanningAsProcessedAsync(CancellationToken cancellationToken)
    {
        var connectionString = _configuration.GetConnectionString("StagingConnection");

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new SqlCommand("""
            UPDATE dbo.planification_api_rawSA
            SET EstTraite = 1
            WHERE EstTraite = 0
              AND Erreur IS NULL;
        """, connection);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task InsertSyncLogAsync(
        int nbLignes,
        string statut,
        int dureeMs,
        string? erreur,
        CancellationToken cancellationToken)
    {
        var connectionString = _configuration.GetConnectionString("StagingConnection");

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(cancellationToken);

        await using var command = new SqlCommand("""
            INSERT INTO dbo.SyncLogs
            (
                DateExecution,
                Source,
                NbLignes,
                Statut,
                DureeMs,
                Erreur
            )
            VALUES
            (
                SYSUTCDATETIME(),
                'Planification',
                @NbLignes,
                @Statut,
                @DureeMs,
                @Erreur
            );
        """, connection);

        command.Parameters.AddWithValue("@NbLignes", nbLignes);
        command.Parameters.AddWithValue("@Statut", statut);
        command.Parameters.AddWithValue("@DureeMs", dureeMs);
        command.Parameters.AddWithValue("@Erreur", (object?)erreur ?? DBNull.Value);

        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private static int CountJsonRows(string json)
    {
        try
        {
            using var document = System.Text.Json.JsonDocument.Parse(json);

            if (document.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                return document.RootElement.GetArrayLength();

            return 1;
        }
        catch
        {
            return 0;
        }
    }
}