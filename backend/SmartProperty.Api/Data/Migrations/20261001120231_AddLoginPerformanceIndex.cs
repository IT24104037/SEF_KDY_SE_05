using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartProperty.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddLoginPerformanceIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {migrationBuilder.Sql(
            """
            CREATE INDEX IF NOT EXISTS "IX_Users_Email_Lower"
            ON "Users" (LOWER("Email"));
            """);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {   migrationBuilder.Sql(
            """
            DROP INDEX IF EXISTS "IX_Users_Email_Lower";
            """);

        }
    }
}
