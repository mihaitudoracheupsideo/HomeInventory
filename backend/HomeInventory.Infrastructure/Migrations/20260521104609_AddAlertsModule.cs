using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAlertsModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AlertDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    SourceModule = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Frequency = table.Column<int>(type: "INTEGER", nullable: false),
                    Interval = table.Column<int>(type: "INTEGER", nullable: false),
                    DayOfWeek = table.Column<int>(type: "INTEGER", nullable: true),
                    DayOfMonth = table.Column<int>(type: "INTEGER", nullable: true),
                    MonthOfYear = table.Column<int>(type: "INTEGER", nullable: true),
                    StartDateUtc = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    DueTimeUtc = table.Column<TimeOnly>(type: "TEXT", nullable: false),
                    LeadTimeDays = table.Column<int>(type: "INTEGER", nullable: false),
                    MessageTemplate = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    IsEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    MetadataJson = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    CronExpression = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AlertOccurrences",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    AlertDefinitionId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PeriodKey = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    DefinitionNameSnapshot = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    SourceModuleSnapshot = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    GeneratedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ActiveFromUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DueAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    NoticedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    SolvedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PayloadJson = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertOccurrences", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AlertOccurrences_AlertDefinitions_AlertDefinitionId",
                        column: x => x.AlertDefinitionId,
                        principalTable: "AlertDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AlertDefinitions_IsEnabled",
                table: "AlertDefinitions",
                column: "IsEnabled");

            migrationBuilder.CreateIndex(
                name: "IX_AlertDefinitions_SourceModule_Name",
                table: "AlertDefinitions",
                columns: new[] { "SourceModule", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AlertOccurrences_AlertDefinitionId_PeriodKey",
                table: "AlertOccurrences",
                columns: new[] { "AlertDefinitionId", "PeriodKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AlertOccurrences_AlertDefinitionId_Status",
                table: "AlertOccurrences",
                columns: new[] { "AlertDefinitionId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_AlertOccurrences_Status_DueAtUtc",
                table: "AlertOccurrences",
                columns: new[] { "Status", "DueAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertOccurrences");

            migrationBuilder.DropTable(
                name: "AlertDefinitions");
        }
    }
}
