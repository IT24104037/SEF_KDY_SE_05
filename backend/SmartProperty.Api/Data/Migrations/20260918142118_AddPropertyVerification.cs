using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SmartProperty.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "Properties",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "Properties",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VerificationStatus",
                table: "Properties",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                "UPDATE \"Properties\" SET \"VerificationStatus\" = 1 WHERE \"VerificationStatus\" = 0;");

            migrationBuilder.AddColumn<DateTime>(
                name: "VerifiedAt",
                table: "Properties",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VerifiedByAdminId",
                table: "Properties",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PropertyVerificationDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PropertyId = table.Column<int>(type: "integer", nullable: false),
                    DocumentType = table.Column<string>(type: "text", nullable: false),
                    DocumentUrl = table.Column<string>(type: "text", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyVerificationDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PropertyVerificationDocuments_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Properties_VerifiedByAdminId",
                table: "Properties",
                column: "VerifiedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyVerificationDocuments_PropertyId",
                table: "PropertyVerificationDocuments",
                column: "PropertyId");

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_Users_VerifiedByAdminId",
                table: "Properties",
                column: "VerifiedByAdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Properties_Users_VerifiedByAdminId",
                table: "Properties");

            migrationBuilder.DropTable(
                name: "PropertyVerificationDocuments");

            migrationBuilder.DropIndex(
                name: "IX_Properties_VerifiedByAdminId",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "VerificationStatus",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "VerifiedAt",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "VerifiedByAdminId",
                table: "Properties");
        }
    }
}
