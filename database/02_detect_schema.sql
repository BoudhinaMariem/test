USE [TriwebDW];
GO

SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_NAME IN (
    'Dim_Date',
    'Dim_equipe',
    'Dim_employe',
    'Dim_client',
    'Dim_periode',
    'Dim_DisponibiliteType',
    'Dim_statut',
    'Dim_projet',
    'fact_performance',
    'fact_disponibilite',
    'fact_planification',
    'fact_production'
  )
ORDER BY TABLE_NAME;
GO

SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN (
  'Dim_Date',
  'Dim_equipe',
  'Dim_employe',
  'Dim_client',
  'Dim_periode',
  'Dim_DisponibiliteType',
  'Dim_statut',
  'Dim_projet',
  'fact_performance',
  'fact_disponibilite',
  'fact_planification',
  'fact_production'
)
ORDER BY TABLE_NAME, ORDINAL_POSITION;
GO
