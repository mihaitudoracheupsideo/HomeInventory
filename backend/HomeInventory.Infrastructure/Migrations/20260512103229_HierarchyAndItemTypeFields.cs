using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HierarchyAndItemTypeFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Item_Item_CurrentLocationItemId",
                table: "Item");

            migrationBuilder.RenameColumn(
                name: "CurrentLocationItemId",
                table: "Item",
                newName: "ParentItemId");

            migrationBuilder.RenameIndex(
                name: "IX_Item_CurrentLocationItemId",
                table: "Item",
                newName: "IX_Item_ParentItemId");

            migrationBuilder.AddColumn<bool>(
                name: "CanContainItems",
                table: "ItemType",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "ItemType",
                type: "TEXT",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Icon",
                table: "ItemType",
                type: "TEXT",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsLeaf",
                table: "ItemType",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "ItemType",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Depth",
                table: "Item",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "NodeIndex",
                table: "Item",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Path",
                table: "Item",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "Item",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Item_Depth",
                table: "Item",
                column: "Depth");

            migrationBuilder.CreateIndex(
                name: "IX_Item_NodeIndex",
                table: "Item",
                column: "NodeIndex");

            migrationBuilder.CreateIndex(
                name: "IX_Item_Path",
                table: "Item",
                column: "Path");

            migrationBuilder.AddForeignKey(
                name: "FK_Item_Item_ParentItemId",
                table: "Item",
                column: "ParentItemId",
                principalTable: "Item",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Item_Item_ParentItemId",
                table: "Item");

            migrationBuilder.DropIndex(
                name: "IX_Item_Depth",
                table: "Item");

            migrationBuilder.DropIndex(
                name: "IX_Item_NodeIndex",
                table: "Item");

            migrationBuilder.DropIndex(
                name: "IX_Item_Path",
                table: "Item");

            migrationBuilder.DropColumn(
                name: "CanContainItems",
                table: "ItemType");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "ItemType");

            migrationBuilder.DropColumn(
                name: "Icon",
                table: "ItemType");

            migrationBuilder.DropColumn(
                name: "IsLeaf",
                table: "ItemType");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "ItemType");

            migrationBuilder.DropColumn(
                name: "Depth",
                table: "Item");

            migrationBuilder.DropColumn(
                name: "NodeIndex",
                table: "Item");

            migrationBuilder.DropColumn(
                name: "Path",
                table: "Item");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "Item");

            migrationBuilder.RenameColumn(
                name: "ParentItemId",
                table: "Item",
                newName: "CurrentLocationItemId");

            migrationBuilder.RenameIndex(
                name: "IX_Item_ParentItemId",
                table: "Item",
                newName: "IX_Item_CurrentLocationItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_Item_Item_CurrentLocationItemId",
                table: "Item",
                column: "CurrentLocationItemId",
                principalTable: "Item",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
