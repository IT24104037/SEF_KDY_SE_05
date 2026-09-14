using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SmartProperty.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantPropertyUnitRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO "PropertyOwners" ("UserId")
                SELECT u."Id"
                FROM "Users" u
                INNER JOIN "Roles" r ON r."Id" = u."RoleId"
                WHERE r."Name" = 'PropertyOwner'
                  AND NOT EXISTS (
                      SELECT 1 FROM "PropertyOwners" po WHERE po."UserId" = u."Id"
                  );
                """);

            migrationBuilder.Sql("""
                INSERT INTO "Properties" ("PropertyOwnerId", "Name", "Address", "CreatedAt", "UpdatedAt", "IsArchived")
                SELECT po."Id", 'Default Property', 'Not provided', NOW(), NOW(), FALSE
                FROM "PropertyOwners" po
                WHERE NOT EXISTS (
                    SELECT 1 FROM "Properties" p WHERE p."PropertyOwnerId" = po."Id"
                );
                """);

            migrationBuilder.Sql("""
                INSERT INTO "Units" ("PropertyId", "UnitLabel", "IsArchived", "CreatedAt", "UpdatedAt")
                SELECT p."Id", 'Default Unit', FALSE, NOW(), NOW()
                FROM "Properties" p
                WHERE NOT EXISTS (
                    SELECT 1 FROM "Units" u WHERE u."PropertyId" = p."Id"
                );
                """);

            migrationBuilder.AddColumn<int>(
                name: "PropertyId",
                table: "Tenants",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "UnitId",
                table: "Tenants",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_PropertyId_UnitId",
                table: "Tenants",
                columns: new[] { "PropertyId", "UnitId" });

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_UnitId",
                table: "Tenants",
                column: "UnitId");

            migrationBuilder.DropIndex(
                name: "IX_PropertyOwners_UserId",
                table: "PropertyOwners");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyOwners_UserId",
                table: "PropertyOwners",
                column: "UserId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tenants_Properties_PropertyId",
                table: "Tenants",
                column: "PropertyId",
                principalTable: "Properties",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tenants_Units_UnitId",
                table: "Tenants",
                column: "UnitId",
                principalTable: "Units",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tenants_Properties_PropertyId",
                table: "Tenants");

            migrationBuilder.DropForeignKey(
                name: "FK_Tenants_Units_UnitId",
                table: "Tenants");

            migrationBuilder.DropTable(
                name: "Units");

            migrationBuilder.DropTable(
                name: "Properties");

            migrationBuilder.DropTable(
                name: "PropertyOwners");

            migrationBuilder.DropIndex(
                name: "IX_Tenants_PropertyId_UnitId",
                table: "Tenants");

            migrationBuilder.DropIndex(
                name: "IX_Tenants_UnitId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "PropertyId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "UnitId",
                table: "Tenants");
        }
    }
}
