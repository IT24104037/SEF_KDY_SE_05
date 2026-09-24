using Microsoft.EntityFrameworkCore;
using SmartProperty.Api.Data;
using SmartProperty.Api.DTOs.Properties;
using SmartProperty.Api.Entities.Property;
using SmartProperty.Api.Services;

namespace SmartProperty.Tests;

public class PropertyVerificationTests
{
    [Fact]
    public async Task VerifiedOwner_CanSubmitProperty_AsUnderReviewWithProof()
    {
        await using var context = CreateContext();
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 1,
            UserId = 101,
            VerificationStatus = OwnerVerificationStatus.Verified
        });
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).CreatePropertyAsync(101, CreateRequest());

        Assert.NotNull(result);
        Assert.Equal("UnderReview", result!.VerificationStatus);
        Assert.Single(context.PropertyVerificationDocuments);
    }

    [Fact]
    public async Task PropertySubmission_RequiresProof()
    {
        await using var context = CreateVerifiedOwnerContext();

        var request = CreateRequest();
        request.DocumentType = "";
        request.DocumentUrl = "";

        var result = await new PropertyService(context).CreatePropertyAsync(101, request);

        Assert.Null(result);
    }

    [Fact]
    public async Task UnverifiedOwner_CannotSubmitProperty()
    {
        await using var context = CreateContext();
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 1,
            UserId = 101,
            VerificationStatus = OwnerVerificationStatus.PendingVerification
        });
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).CreatePropertyAsync(101, CreateRequest());

        Assert.Null(result);
    }

    [Fact]
    public async Task RejectedProperty_CanBeResubmittedByItsOwner()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Original Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Address needs correction."
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();
        context.PropertyVerificationDocuments.Add(new PropertyVerificationDocument
        {
            PropertyId = property.Id,
            DocumentType = "Ownership Deed",
            DocumentUrl = "https://example.test/deed.pdf"
        });
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            101,
            property.Id,
            new ResubmitPropertyDto
            {
                Name = "Updated Property",
                Address = "2 Main Street",
                City = "Updated City"
                // No removals, no new docs – keep existing document
            });

        Assert.NotNull(result);
        Assert.Equal("UnderReview", result!.VerificationStatus);
        Assert.Null(result.RejectionReason);
        Assert.Equal("Updated Property", result.Name);
        Assert.Equal("2 Main Street", result.Address);
        Assert.Equal("Updated City", result.City);
    }

    [Fact]
    public async Task RejectedProperty_CanResubmitWithUpdatedProofForSameProperty()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Rejected Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Old proof is unclear."
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();
        var existingDoc = new PropertyVerificationDocument
        {
            PropertyId = property.Id,
            DocumentType = "Old deed",
            DocumentUrl = "https://example.test/old-proof.pdf"
        };
        context.PropertyVerificationDocuments.Add(existingDoc);
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            101,
            property.Id,
            new ResubmitPropertyDto
            {
                Name = "Updated Property",
                Address = "2 Main Street",
                RemovedDocumentIds = new List<int> { existingDoc.Id },
                NewDocuments = new List<NewVerificationDocumentDto>
                {
                    new() { DocumentType = "Updated deed", DocumentUrl = "https://example.test/new-proof.pdf" }
                }
            });

        var documents = await context.PropertyVerificationDocuments
            .Where(document => document.PropertyId == property.Id)
            .OrderBy(document => document.Id)
            .ToListAsync();

        Assert.NotNull(result);
        Assert.Equal("UnderReview", result!.VerificationStatus);
        Assert.Null(result.RejectionReason);
        // Old document removed, new one added – exactly one document remains.
        Assert.Single(documents);
        Assert.Equal("Updated deed", documents[0].DocumentType);
        Assert.Equal("https://example.test/new-proof.pdf", documents[0].DocumentUrl);
    }

    [Fact]
    public async Task RejectedProperty_CanResubmitWithoutReplacingProof()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Rejected Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Address needs correction."
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();
        context.PropertyVerificationDocuments.Add(new PropertyVerificationDocument
        {
            PropertyId = property.Id,
            DocumentType = "Ownership Deed",
            DocumentUrl = "https://example.test/deed.pdf"
        });
        await context.SaveChangesAsync();

        // Resubmit with no document changes – the existing doc must survive.
        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            101,
            property.Id,
            new ResubmitPropertyDto
            {
                Name = "Updated Property",
                Address = "2 Main Street"
                // Empty RemovedDocumentIds and NewDocuments by default
            });

        Assert.NotNull(result);
        Assert.Single(context.PropertyVerificationDocuments);
        Assert.Equal("Ownership Deed",
            context.PropertyVerificationDocuments.Single().DocumentType);
    }

    [Fact]
    public async Task ApprovedPropertyEditing_DoesNotAddOrRequireProof()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Approved Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Approved
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).UpdatePropertyAsync(
            101,
            property.Id,
            new UpdatePropertyDto
            {
                Name = "Updated Approved Property",
                Address = "2 Main Street"
            });

        Assert.NotNull(result);
        Assert.Equal("Updated Approved Property", result!.Name);
        Assert.Empty(context.PropertyVerificationDocuments);
    }

    [Fact]
    public async Task RejectedProperty_CannotBeResubmittedByAnotherOwner()
    {
        await using var context = CreateVerifiedOwnerContext();
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 2,
            UserId = 202,
            VerificationStatus = OwnerVerificationStatus.Verified
        });
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Rejected Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Needs correction."
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();
        context.PropertyVerificationDocuments.Add(new PropertyVerificationDocument
        {
            PropertyId = property.Id,
            DocumentType = "Deed",
            DocumentUrl = "https://example.test/deed.pdf"
        });
        await context.SaveChangesAsync();
        property = await context.Properties.SingleAsync();

        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            202,
            property.Id,
            new ResubmitPropertyDto
            {
                Name = "Tampered Property",
                Address = "2 Main Street",
                NewDocuments = new List<NewVerificationDocumentDto>
                {
                    new() { DocumentType = "Tampered deed", DocumentUrl = "https://example.test/tampered-proof.pdf" }
                }
            });

        Assert.Null(result);
        Assert.Equal(PropertyVerificationStatus.Rejected, property.VerificationStatus);
        Assert.Equal("Needs correction.", property.RejectionReason);
    }

    [Theory]
    [InlineData(PropertyVerificationStatus.UnderReview)]
    [InlineData(PropertyVerificationStatus.Approved)]
    public async Task NonRejectedProperty_CannotUseResubmissionFlow(
        PropertyVerificationStatus status)
    {
        await using var context = CreateVerifiedOwnerContext();
        context.Properties.Add(new Property
        {
            PropertyOwnerId = 1,
            Name = "Property",
            Address = "1 Main Street",
            VerificationStatus = status
        });
        await context.SaveChangesAsync();
        var property = await context.Properties.SingleAsync();

        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            101,
            property.Id,
            new ResubmitPropertyDto
            {
                Name = "Updated Property",
                Address = "2 Main Street"
            });

        Assert.Null(result);
        Assert.Equal(status, property.VerificationStatus);
    }

    [Fact]
    public async Task ArchivedRejectedProperty_CannotBeResubmitted()
    {
        await using var context = CreateVerifiedOwnerContext();
        context.Properties.Add(new Property
        {
            PropertyOwnerId = 1,
            Name = "Archived Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Needs correction.",
            IsArchived = true
        });
        await context.SaveChangesAsync();
        var property = await context.Properties.SingleAsync();

        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            101,
            property.Id,
            new ResubmitPropertyDto
            {
                Name = "Updated Property",
                Address = "2 Main Street"
            });

        Assert.Null(result);
        Assert.Equal(PropertyVerificationStatus.Rejected, property.VerificationStatus);
    }

    [Fact]
    public async Task UnapprovedProperty_CannotCreateUnits()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Review Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.UnderReview
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).CreateUnitAsync(101, property.Id, new CreateUnitDto
        {
            UnitLabel = "A-1"
        });

        Assert.False(result.Success);
    }

    [Fact]
    public async Task ApprovedProperty_CanCreateUnits()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Approved Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Approved
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).CreateUnitAsync(101, property.Id, new CreateUnitDto
        {
            UnitLabel = "A-1"
        });

        Assert.True(result.Success);
    }

    [Fact]
    public async Task Dashboard_ExcludesUnapprovedPropertiesAndUnits()
    {
        await using var context = CreateVerifiedOwnerContext();
        context.Properties.AddRange(
            new Property
            {
                PropertyOwnerId = 1,
                Name = "Approved",
                Address = "1 Main Street",
                VerificationStatus = PropertyVerificationStatus.Approved
            },
            new Property
            {
                PropertyOwnerId = 1,
                Name = "Review",
                Address = "2 Main Street",
                VerificationStatus = PropertyVerificationStatus.UnderReview
            });
        await context.SaveChangesAsync();
        var approved = await context.Properties.SingleAsync(p => p.Name == "Approved");
        var review = await context.Properties.SingleAsync(p => p.Name == "Review");
        context.Units.AddRange(
            new Unit { PropertyId = approved.Id, UnitLabel = "A-1" },
            new Unit { PropertyId = review.Id, UnitLabel = "R-1" });
        await context.SaveChangesAsync();

        var dashboard = await new PropertyService(context).GetOwnerDashboardAsync(101);

        Assert.NotNull(dashboard);
        Assert.Equal(1, dashboard!.ActiveProperties);
        Assert.Equal(1, dashboard.ActiveUnits);
        Assert.Equal(1, dashboard.VacantUnits);
    }

    // ---------------------------------------------------------------
    // New document-lifecycle tests
    // ---------------------------------------------------------------

    [Fact]
    public async Task Resubmit_WithNoDocumentChanges_PreservesExistingDocuments()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Rejected Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Address issue."
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();
        context.PropertyVerificationDocuments.AddRange(
            new PropertyVerificationDocument { PropertyId = property.Id, DocumentType = "Deed",       DocumentUrl = "https://example.test/deed.pdf" },
            new PropertyVerificationDocument { PropertyId = property.Id, DocumentType = "Agreement",  DocumentUrl = "https://example.test/agreement.pdf" });
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            101, property.Id,
            new ResubmitPropertyDto { Name = "Updated", Address = "2 Main Street" });

        Assert.NotNull(result);
        Assert.Equal(2, context.PropertyVerificationDocuments.Count(d => d.PropertyId == property.Id));
    }

    [Fact]
    public async Task Resubmit_RemovingDocument_DeletesItFromDb()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Rejected Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Needs correction."
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();
        var doc1 = new PropertyVerificationDocument { PropertyId = property.Id, DocumentType = "Deed",     DocumentUrl = "https://example.test/deed.pdf" };
        var doc2 = new PropertyVerificationDocument { PropertyId = property.Id, DocumentType = "Agreement", DocumentUrl = "https://example.test/agreement.pdf" };
        context.PropertyVerificationDocuments.AddRange(doc1, doc2);
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            101, property.Id,
            new ResubmitPropertyDto
            {
                Name = "Updated",
                Address = "2 Main Street",
                RemovedDocumentIds = new List<int> { doc1.Id }
            });

        Assert.NotNull(result);
        var remaining = context.PropertyVerificationDocuments.Where(d => d.PropertyId == property.Id).ToList();
        Assert.Single(remaining);
        Assert.Equal("Agreement", remaining[0].DocumentType);
    }

    [Fact]
    public async Task Resubmit_AddingNewDocument_AppendsToExisting()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Rejected Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Needs more proof."
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();
        context.PropertyVerificationDocuments.Add(
            new PropertyVerificationDocument { PropertyId = property.Id, DocumentType = "Deed", DocumentUrl = "https://example.test/deed.pdf" });
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            101, property.Id,
            new ResubmitPropertyDto
            {
                Name = "Updated",
                Address = "2 Main Street",
                NewDocuments = new List<NewVerificationDocumentDto>
                {
                    new() { DocumentType = "Agreement", DocumentUrl = "https://example.test/agreement.pdf" }
                }
            });

        Assert.NotNull(result);
        Assert.Equal(2, context.PropertyVerificationDocuments.Count(d => d.PropertyId == property.Id));
    }

    [Fact]
    public async Task Resubmit_RemoveOldAndAddNew_ResultsInOnlyNewDocument()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Rejected Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Proof unclear."
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();
        var oldDoc = new PropertyVerificationDocument
        {
            PropertyId = property.Id,
            DocumentType = "Old Deed",
            DocumentUrl = "https://example.test/old.pdf"
        };
        context.PropertyVerificationDocuments.Add(oldDoc);
        await context.SaveChangesAsync();

        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            101, property.Id,
            new ResubmitPropertyDto
            {
                Name = "Updated",
                Address = "2 Main Street",
                RemovedDocumentIds = new List<int> { oldDoc.Id },
                NewDocuments = new List<NewVerificationDocumentDto>
                {
                    new() { DocumentType = "New Deed", DocumentUrl = "https://example.test/new.pdf" }
                }
            });

        Assert.NotNull(result);
        var docs = context.PropertyVerificationDocuments.Where(d => d.PropertyId == property.Id).ToList();
        Assert.Single(docs);
        Assert.Equal("New Deed", docs[0].DocumentType);
    }

    [Fact]
    public async Task Resubmit_CannotRemoveDocumentFromAnotherProperty()
    {
        await using var context = CreateVerifiedOwnerContext();
        // Property A belongs to owner 1
        var propertyA = new Property
        {
            PropertyOwnerId = 1,
            Name = "Property A",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Needs correction."
        };
        // Property B also belongs to owner 1 (or any owner) – its doc must not be removable via property A resubmit
        var propertyB = new Property
        {
            PropertyOwnerId = 1,
            Name = "Property B",
            Address = "2 Main Street",
            VerificationStatus = PropertyVerificationStatus.Approved
        };
        context.Properties.AddRange(propertyA, propertyB);
        await context.SaveChangesAsync();

        var docA = new PropertyVerificationDocument { PropertyId = propertyA.Id, DocumentType = "Deed A", DocumentUrl = "https://example.test/a.pdf" };
        var docB = new PropertyVerificationDocument { PropertyId = propertyB.Id, DocumentType = "Deed B", DocumentUrl = "https://example.test/b.pdf" };
        context.PropertyVerificationDocuments.AddRange(docA, docB);
        await context.SaveChangesAsync();

        // Attempt to remove docB (which belongs to Property B) through Property A resubmit
        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            101, propertyA.Id,
            new ResubmitPropertyDto
            {
                Name = "Updated A",
                Address = "1 Main Street",
                RemovedDocumentIds = new List<int> { docB.Id }  // cross-property removal attempt
            });

        Assert.Null(result);
        // Both documents must still exist
        Assert.Equal(2, context.PropertyVerificationDocuments.Count());
    }

    [Fact]
    public async Task Resubmit_RemovingAllDocumentsWithoutAddingNew_IsRejected()
    {
        await using var context = CreateVerifiedOwnerContext();
        var property = new Property
        {
            PropertyOwnerId = 1,
            Name = "Rejected Property",
            Address = "1 Main Street",
            VerificationStatus = PropertyVerificationStatus.Rejected,
            RejectionReason = "Needs correction."
        };
        context.Properties.Add(property);
        await context.SaveChangesAsync();
        var doc = new PropertyVerificationDocument
        {
            PropertyId = property.Id,
            DocumentType = "Deed",
            DocumentUrl = "https://example.test/deed.pdf"
        };
        context.PropertyVerificationDocuments.Add(doc);
        await context.SaveChangesAsync();

        // Try to remove the only document without providing a replacement
        var result = await new PropertyService(context).ResubmitRejectedPropertyAsync(
            101, property.Id,
            new ResubmitPropertyDto
            {
                Name = "Updated",
                Address = "2 Main Street",
                RemovedDocumentIds = new List<int> { doc.Id }
                // No NewDocuments – would leave zero documents
            });

        Assert.Null(result);
        // Document must not have been deleted
        Assert.Single(context.PropertyVerificationDocuments);
        // Property must still be Rejected
        Assert.Equal(PropertyVerificationStatus.Rejected,
            (await context.Properties.SingleAsync()).VerificationStatus);
    }

    private static AppDbContext CreateVerifiedOwnerContext()
    {
        var context = CreateContext();
        context.PropertyOwners.Add(new PropertyOwner
        {
            Id = 1,
            UserId = 101,
            VerificationStatus = OwnerVerificationStatus.Verified
        });
        context.SaveChanges();
        return context;
    }

    private static CreatePropertyDto CreateRequest() => new()
    {
        Name = "New Property",
        Address = "1 Main Street",
        DocumentType = "Ownership Proof",
        DocumentUrl = "https://example.test/proof.pdf"
    };

    private static AppDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }
}
