using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Triweb.Api.Services;

namespace TriwebDashboard.Api.Controllers;

[ApiController]
[Route("api/chatbot")]
public class ChatbotController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _environment;
    private readonly DashboardService _dashboardService;

    public ChatbotController(
        IConfiguration configuration,
        IWebHostEnvironment environment,
        DashboardService dashboardService)
    {
        _configuration = configuration;
        _environment = environment;
        _dashboardService = dashboardService;
    }

    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] ChatbotRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Question))
        {
            return BadRequest(new ChatbotResponse
            {
                Success = false,
                Answer = "Question vide.",
                Count = 0
            });
        }

        string pythonPath = _configuration["Chatbot:PythonPath"] ?? "C:\\python313\\python.exe";
        string scriptRelativePath = _configuration["Chatbot:ScriptPath"] ?? "AI/chatbot_model.py";
        string scriptPath = Path.Combine(_environment.ContentRootPath, scriptRelativePath);

        if (!System.IO.File.Exists(scriptPath))
        {
            return StatusCode(500, new ChatbotResponse
            {
                Success = false,
                Answer = $"Script Python introuvable : {scriptPath}",
                Count = 0
            });
        }

        var dashboardItems = await _dashboardService.GetItemsAsync();

        var payload = new
        {
            question = request.Question,
            items = dashboardItems
        };

        string inputJson = JsonSerializer.Serialize(payload);

        var startInfo = new ProcessStartInfo
        {
            FileName = pythonPath,
            Arguments = $"\"{scriptPath}\"",
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding = Encoding.UTF8
        };

        try
        {
            using var process = new Process
            {
                StartInfo = startInfo
            };

            process.Start();

            await process.StandardInput.WriteAsync(inputJson);
            process.StandardInput.Close();

            var outputTask = process.StandardOutput.ReadToEndAsync();
            var errorTask = process.StandardError.ReadToEndAsync();

            var completedTask = await Task.WhenAny(
                process.WaitForExitAsync(),
                Task.Delay(TimeSpan.FromSeconds(45))
            );

            if (completedTask != process.WaitForExitAsync() && !process.HasExited)
            {
                process.Kill(true);

                return StatusCode(504, new ChatbotResponse
                {
                    Success = false,
                    Answer = "Le chatbot Python a dépassé le délai d’exécution.",
                    Count = 0
                });
            }

            string output = await outputTask;
            string error = await errorTask;

            if (!string.IsNullOrWhiteSpace(error))
            {
                Console.WriteLine("Python chatbot stderr:");
                Console.WriteLine(error);
            }

            if (string.IsNullOrWhiteSpace(output))
            {
                return StatusCode(500, new ChatbotResponse
                {
                    Success = false,
                    Answer = "Le script Python n’a retourné aucune réponse.",
                    Count = 0
                });
            }

            var response = JsonSerializer.Deserialize<ChatbotResponse>(
                output,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }
            );

            return Ok(response);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ChatbotResponse
            {
                Success = false,
                Answer = "Erreur backend chatbot : " + ex.Message,
                Count = 0
            });
        }
    }
}

public class ChatbotRequest
{
    public string Question { get; set; } = string.Empty;
}

public class ChatbotResponse
{
    public bool Success { get; set; }
    public string Answer { get; set; } = string.Empty;
    public int Count { get; set; }
}