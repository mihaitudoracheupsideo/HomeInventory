using HomeInventory.Application.Alerts;
using Microsoft.AspNetCore.Mvc;

namespace HomeInventory.WebApi.Controllers;

[ApiController]
[Route("api/admin/alert-definitions")]
public sealed class AdminAlertDefinitionsController : ControllerBase
{
    private readonly IAlertDefinitionService _alertDefinitionService;

    public AdminAlertDefinitionsController(IAlertDefinitionService alertDefinitionService)
    {
        _alertDefinitionService = alertDefinitionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken = default)
    {
        var definitions = await _alertDefinitionService.GetAllAsync(cancellationToken);
        return Ok(definitions);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var definition = await _alertDefinitionService.GetByIdAsync(id, cancellationToken);
        return definition == null ? NotFound() : Ok(definition);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAlertDefinitionDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var definition = await _alertDefinitionService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = definition.Id }, definition);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAlertDefinitionDto dto, CancellationToken cancellationToken = default)
    {
        try
        {
            var definition = await _alertDefinitionService.UpdateAsync(id, dto, cancellationToken);
            return definition == null ? NotFound() : Ok(definition);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}