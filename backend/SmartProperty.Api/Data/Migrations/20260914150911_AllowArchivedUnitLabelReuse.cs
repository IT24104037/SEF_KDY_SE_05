using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartProperty.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AllowArchivedUnitLabelReuse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Units_PropertyId_UnitLabel",
                table: "Units");

            migrationBuilder.CreateIndex(
                name: "IX_Units_PropertyId_UnitLabel",
                table: "Units",
                columns: new[] { "PropertyId", "UnitLabel" },
                unique: true,
                filter: "\"IsArchived\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Units_PropertyId_UnitLabel",
                table: "Units");

            migrationBuilder.CreateIndex(
                name: "IX_Units_PropertyId_UnitLabel",
                table: "Units",
                columns: new[] { "PropertyId", "UnitLabel" },
                unique: true);
        }
    }
}
