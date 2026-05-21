using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteAndSyncMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Deleted",
                table: "Tags",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Tags",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "Deleted",
                table: "ItemType",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "ItemType",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "Deleted",
                table: "Item",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Tags_Deleted",
                table: "Tags",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_UpdatedAt",
                table: "Tags",
                column: "UpdatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ItemType_Deleted",
                table: "ItemType",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_ItemType_UpdatedAt",
                table: "ItemType",
                column: "UpdatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Item_Deleted",
                table: "Item",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_Item_UpdatedAt",
                table: "Item",
                column: "UpdatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tags_Deleted",
                table: "Tags");

            migrationBuilder.DropIndex(
                name: "IX_Tags_UpdatedAt",
                table: "Tags");

            migrationBuilder.DropIndex(
                name: "IX_ItemType_Deleted",
                table: "ItemType");

            migrationBuilder.DropIndex(
                name: "IX_ItemType_UpdatedAt",
                table: "ItemType");

            migrationBuilder.DropIndex(
                name: "IX_Item_Deleted",
                table: "Item");

            migrationBuilder.DropIndex(
                name: "IX_Item_UpdatedAt",
                table: "Item");

            migrationBuilder.DropColumn(
                name: "Deleted",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "Deleted",
                table: "ItemType");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "ItemType");

            migrationBuilder.DropColumn(
                name: "Deleted",
                table: "Item");
        }
    }
}
