namespace Triweb.Api.Models;

public record MetaTableDto(string Name, int Rows, List<string> Columns);
public record MetaDto(string Database, string? LatestFactDate, List<MetaTableDto> Tables);

public record KpiDto(string Label, string Value, string? Change = null, string? Trend = null, string? Tone = null);
public record ChartPointDto(Dictionary<string, object?> Values);
public record RecentProjectDto(string Id, string Client, string Employe, string Statut);

public record OverviewDto(
    string Title,
    string Subtitle,
    List<KpiDto> Kpis,
    List<Dictionary<string, object?>> ProductionEvolution,
    List<Dictionary<string, object?>> PerformanceByTeam,
    List<RecentProjectDto> RecentProjects);

public record ProductionTypeDto(string Type, string Total, string Temps);
public record ProductionEmployeeDto(string Employe, int Projets, decimal Heures, decimal Redaction, decimal Graphisme, int Efficacite);
public record ProductionDto(
    string Title,
    string Subtitle,
    List<ProductionTypeDto> ProductionParType,
    List<Dictionary<string, object?>> StatutData,
    List<ProductionEmployeeDto> EmployeData);

public record PerformanceEmployeeDto(string Nom, int Note, int Projets, int Acceptation);
public record PerformanceDto(
    string Title,
    string Subtitle,
    List<KpiDto> Kpis,
    List<Dictionary<string, object?>> EvolutionData,
    List<Dictionary<string, object?>> CompetencesData,
    List<PerformanceEmployeeDto> EmployesPerformants);

public record PlanificationUpcomingDto(string Projet, string Client, string Debut, string Estimation, string Equipe);
public record TeamOccupationDto(string Equipe, int Occupation);
public record PlanificationDto(
    string Title,
    string Subtitle,
    Dictionary<string, object?> Summary,
    List<Dictionary<string, object?>> Semaines,
    List<PlanificationUpcomingDto> ProjetsVenir,
    List<TeamOccupationDto> OccupationEquipes);

public record DisponibiliteEmployeDto(string Nom, string Statut, string Type, int Heures);
public record DisponibiliteDto(
    string Title,
    string Subtitle,
    Dictionary<string, object?> Kpis,
    List<Dictionary<string, object?>> DisponibiliteJour,
    List<DisponibiliteEmployeDto> Employes,
    List<Dictionary<string, object?>> TypesAbsence);

public record ModelsIaDto(
    string Title,
    string Subtitle,
    Dictionary<string, object?> Stats,
    List<Dictionary<string, object?>> Predictions,
    List<Dictionary<string, object?>> Modeles,
    List<string> Recommandations,
    List<Dictionary<string, object?>> Executions);
