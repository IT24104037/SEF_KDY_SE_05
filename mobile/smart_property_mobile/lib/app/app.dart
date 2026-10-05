import 'package:flutter/material.dart';

import '../core/theme/app_colors.dart';
import '../core/theme/app_theme.dart';
import '../features/auth/services/auth_service.dart';
import 'app_router.dart';

class SmartPropertyApp extends StatelessWidget {
  const SmartPropertyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Smart Property',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const _SessionBootstrapScreen(),
      onGenerateRoute: AppRouter.onGenerateRoute,
    );
  }
}

class _SessionBootstrapScreen extends StatefulWidget {
  const _SessionBootstrapScreen();

  @override
  State<_SessionBootstrapScreen> createState() =>
      _SessionBootstrapScreenState();
}

class _SessionBootstrapScreenState extends State<_SessionBootstrapScreen> {
  final AuthService _authService = AuthService();

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    final session = await _authService.restoreSession();

    if (!mounted) return;

    final route = session == null
        ? AppRoutes.login
        : AppRouter.routeForRole(session.role);

    Navigator.of(context).pushNamedAndRemoveUntil(route, (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: CircularProgressIndicator(color: AppColors.ownerAccent),
      ),
    );
  }
}
