using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HomeInventory.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTagsAndImagePathToItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "Item",
                type: "TEXT",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tags",
                table: "Item",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "Item");

            migrationBuilder.DropColumn(
                name: "Tags",
                table: "Item");
        }
    }
}
