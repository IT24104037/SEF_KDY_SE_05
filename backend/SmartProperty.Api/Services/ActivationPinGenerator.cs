using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using SmartProperty.Api.Interfaces;

namespace SmartProperty.Api.Services;

// Generates a random 6-digit PIN using a cryptographically secure random
// number generator (NOT `new Random()`, which is predictable). Hashing
// reuses ASP.NET Core Identity's PasswordHasher — the same hashing approach
// already used for real passwords, so the whole project has one hashing
// strategy instead of two.
public class ActivationPinGenerator : IActivationPinGenerator
{
    private readonly PasswordHasher<object> _hasher = new();

    public (string rawPin, string pinHash) GeneratePin()
    {
        int value = RandomNumberGenerator.GetInt32(0, 1_000_000); // 0 - 999999
        string rawPin = value.ToString("D6"); // always 6 digits, zero-padded

        string pinHash = _hasher.HashPassword(null!, rawPin);
        return (rawPin, pinHash);
    }

    public bool VerifyPin(string rawPin, string pinHash)
    {
        var result = _hasher.VerifyHashedPassword(null!, pinHash, rawPin);
        return result == PasswordVerificationResult.Success
            || result == PasswordVerificationResult.SuccessRehashNeeded;
    }
}