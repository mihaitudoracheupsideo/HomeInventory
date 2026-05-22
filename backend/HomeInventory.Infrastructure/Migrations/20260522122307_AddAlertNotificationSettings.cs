using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAlertNotificationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AlertNotificationSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    EmailEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
                    FromEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    FromName = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    RecipientsJson = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    SmtpHost = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    SmtpPort = table.Column<int>(type: "INTEGER", nullable: false),
                    SmtpEnableSsl = table.Column<bool>(type: "INTEGER", nullable: false),
                    SmtpUsername = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
                    SmtpPasswordProtected = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: true),
                    SubjectTemplate = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    HtmlTemplate = table.Column<string>(type: "TEXT", maxLength: 12000, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertNotificationSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertNotificationSettings");
        }
    }
}
