using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartProperty.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMaintenanceAnalysisResultConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceAnalysisResults_MaintenanceRequestId",
                table: "MaintenanceAnalysisResults",
                column: "MaintenanceRequestId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_MaintenanceAnalysisResults_MaintenanceRequests_MaintenanceR~",
                table: "MaintenanceAnalysisResults",
                column: "MaintenanceRequestId",
                principalTable: "MaintenanceRequests",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaintenanceAnalysisResults_MaintenanceRequests_MaintenanceR~",
                table: "MaintenanceAnalysisResults");

            migrationBuilder.DropIndex(
                name: "IX_MaintenanceAnalysisResults_MaintenanceRequestId",
                table: "MaintenanceAnalysisResults");
        }
    }
}
