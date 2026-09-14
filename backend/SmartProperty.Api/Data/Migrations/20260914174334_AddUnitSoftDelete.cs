using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartProperty.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUnitSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Units_PropertyId_UnitLabel",
                table: "Units");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Units",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Units",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Units_PropertyId_UnitLabel",
                table: "Units",
                columns: new[] { "PropertyId", "UnitLabel" },
                unique: true,
                filter: "\"IsArchived\" = false AND \"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Units_PropertyId_UnitLabel",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Units");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Units");

            migrationBuilder.CreateIndex(
                name: "IX_Units_PropertyId_UnitLabel",
                table: "Units",
                columns: new[] { "PropertyId", "UnitLabel" },
                unique: true,
                filter: "\"IsArchived\" = false");
        }
    }
}
