using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateLocationTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Location");

            migrationBuilder.AddColumn<DateTime>(
                name: "AddedAt",
                table: "Item",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "CurrentLocationItemId",
                table: "Item",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LocationHistory",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ItemId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LocationItemId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LocationHistory", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LocationHistory_Item_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Item",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LocationHistory_Item_LocationItemId",
                        column: x => x.LocationItemId,
                        principalTable: "Item",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Item_CurrentLocationItemId",
                table: "Item",
                column: "CurrentLocationItemId");

            migrationBuilder.CreateIndex(
                name: "IX_LocationHistory_AddedAt",
                table: "LocationHistory",
                column: "AddedAt");

            migrationBuilder.CreateIndex(
                name: "IX_LocationHistory_ItemId",
                table: "LocationHistory",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_LocationHistory_ItemId_AddedAt",
                table: "LocationHistory",
                columns: new[] { "ItemId", "AddedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_LocationHistory_LocationItemId",
                table: "LocationHistory",
                column: "LocationItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_Item_Item_CurrentLocationItemId",
                table: "Item",
                column: "CurrentLocationItemId",
                principalTable: "Item",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Item_Item_CurrentLocationItemId",
                table: "Item");

            migrationBuilder.DropTable(
                name: "LocationHistory");

            migrationBuilder.DropIndex(
                name: "IX_Item_CurrentLocationItemId",
                table: "Item");

            migrationBuilder.DropColumn(
                name: "AddedAt",
                table: "Item");

            migrationBuilder.DropColumn(
                name: "CurrentLocationItemId",
                table: "Item");

            migrationBuilder.CreateTable(
                name: "Location",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ItemId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LocationItemId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AddedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Current = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Location", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Location_Item_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Item",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Location_Item_LocationItemId",
                        column: x => x.LocationItemId,
                        principalTable: "Item",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Location_AddedAt",
                table: "Location",
                column: "AddedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Location_ItemId_Current",
                table: "Location",
                columns: new[] { "ItemId", "Current" },
                unique: true,
                filter: "[Current] = 1");

            migrationBuilder.CreateIndex(
                name: "IX_Location_LocationItemId",
                table: "Location",
                column: "LocationItemId");
        }
    }
}
