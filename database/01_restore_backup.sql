/*
  Adaptez les chemins DISK / MDF / LDF avant exécution.
*/

RESTORE FILELISTONLY
FROM DISK = N'C:\backup\TriwebDW.bak';
GO

RESTORE DATABASE TriwebDW
FROM DISK = N'C:\backup\TriwebDW.bak'
WITH REPLACE,
MOVE N'TriwebDW' TO N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\TriwebDW.mdf',
MOVE N'TriwebDW_log' TO N'C:\Program Files\Microsoft SQL Server\MSSQL16.MSSQLSERVER\MSSQL\DATA\TriwebDW_log.ldf';
GO
