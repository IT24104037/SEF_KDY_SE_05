import 'package:flutter/material.dart';

import 'features/maintenance/screens/my_requests_screen.dart';
import 'features/maintenance/screens/report_emergency_screen.dart';
import 'features/maintenance/screens/report_maintenance_screen.dart';
import 'features/maintenance/screens/owner_maintenance_requests_screen.dart';void main() {
  runApp(const SmartPropertyApp());
}

class SmartPropertyApp extends StatelessWidget {
  const SmartPropertyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'Smart Property Maintenance',
      debugShowCheckedModeBanner: false,
      home: MaintenanceTestLauncher(),
    );
  }
}

class MaintenanceTestLauncher extends StatefulWidget {
  const MaintenanceTestLauncher({super.key});

  @override
  State<MaintenanceTestLauncher> createState() =>
      _MaintenanceTestLauncherState();
}

class _MaintenanceTestLauncherState
    extends State<MaintenanceTestLauncher> {
  final TextEditingController _tokenController =
      TextEditingController();

  @override
  void dispose() {
    _tokenController.dispose();
    super.dispose();
  }

  String? _getToken() {
    final token = _tokenController.text.trim();

    if (token.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Paste a Tenant JWT token first.',
          ),
        ),
      );

      return null;
    }

    return token;
  }

  void _openMaintenance() {
    final token = _getToken();

    if (token == null) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ReportMaintenanceScreen(
          token: token,
        ),
      ),
    );
  }

  void _openEmergency() {
    final token = _getToken();

    if (token == null) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ReportEmergencyScreen(
          token: token,
        ),
      ),
    );
  }

  void _openMyRequests() {
    final token = _getToken();

    if (token == null) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => MyRequestsScreen(
          token: token,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Maintenance Mobile Test',
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment:
                CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Development Test Launcher',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 8),

              const Text(
                'This screen is temporary. Paste a valid Tenant JWT token to test the Maintenance mobile feature.',
              ),

              const SizedBox(height: 20),

              TextField(
                controller: _tokenController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Tenant JWT Token',
                  border: OutlineInputBorder(),
                ),
              ),

              const SizedBox(height: 25),

              ElevatedButton(
                onPressed: _openMaintenance,
                child: const Text(
                  'Report Maintenance',
                ),
              ),

              const SizedBox(height: 12),

              ElevatedButton(
                onPressed: _openEmergency,
                child: const Text(
                  'Report Emergency',
                ),
              ),

              const SizedBox(height: 12),

              ElevatedButton(
                onPressed: _openMyRequests,
                child: const Text(
                  'My Maintenance Requests',
                ),
              ),

              const SizedBox(height: 12),

              ElevatedButton(
                onPressed: () {
                  final token = _tokenController.text.trim();

                  if (token.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Please enter a JWT token first.'),
                      ),
                    );
                    return;
                  }

                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => OwnerMaintenanceRequestsScreen(
                        token: token,
                      ),
                    ),
                  );
                },
                child: const Text('Owner Maintenance Requests'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}