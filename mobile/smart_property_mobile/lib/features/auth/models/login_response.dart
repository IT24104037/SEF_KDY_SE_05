class LoginResponse {
  const LoginResponse({
    required this.token,
    required this.userId,
    required this.fullName,
    required this.role,
  });

  final String token;
  final int userId;
  final String fullName;
  final String role;

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    final token = json['token'];
    final userId = json['userId'];
    final fullName = json['fullName'];
    final role = json['role'];

    if (token is! String ||
        token.isEmpty ||
        userId is! num ||
        fullName is! String ||
        fullName.isEmpty ||
        role is! String ||
        role.isEmpty) {
      throw const FormatException('Invalid login response.');
    }

    return LoginResponse(
      token: token,
      userId: userId.toInt(),
      fullName: fullName,
      role: role,
    );
  }
}
