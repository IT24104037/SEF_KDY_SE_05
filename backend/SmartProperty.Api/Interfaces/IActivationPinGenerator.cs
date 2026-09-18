namespace SmartProperty.Api.Interfaces;

public interface IActivationPinGenerator
{
    (string rawPin, string pinHash) GeneratePin();

    bool VerifyPin(string rawPin, string pinHash);
}