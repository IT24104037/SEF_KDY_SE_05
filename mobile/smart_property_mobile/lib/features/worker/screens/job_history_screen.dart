import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/worker_service.dart';
import '../widgets/work_order_card.dart';
import 'worker_dashboard_screen.dart';

class JobHistoryScreen extends StatefulWidget {
  const JobHistoryScreen({super.key});

  @override
  State<JobHistoryScreen> createState() => _JobHistoryScreenState();
}

class _JobHistoryScreenState extends State<JobHistoryScreen> {
  final WorkerService _service = WorkerService.instance;

  List<Map<String, dynamic>> _orders = [];

  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final orders = await _service.getWorkOrders();

      if (!mounted) return;

      setState(() {
        _orders = orders.where((item) {
          final status = item['status']?.toString();

          return status == 'Completed' || status == 'Cancelled';
        }).toList();
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  void _openOrder(Map<String, dynamic> item) {
    final id = int.tryParse(item['id'].toString());

    if (id == null) return;

    Navigator.of(context).pushNamed('${AppRoutes.workerJobs}/$id');
  }

  @override
  Widget build(BuildContext context) {
    return RoleScaffold(
      title: 'Job History',
      roleLabel: 'Maintenance Worker',
      expectedRole: 'MaintenanceWorker',
      accentColor: AppColors.workerAccent,
      menuItems: WorkerDashboardScreen.menuItems,
      currentRoute: AppRoutes.workerJobHistory,
      showBackButton: true,

      child: RefreshIndicator(
        color: AppColors.workerAccent,
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'Job History',
              style: TextStyle(
                color: AppColors.heading,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Completed and cancelled maintenance jobs.',
              style: TextStyle(color: AppColors.secondaryText),
            ),
            const SizedBox(height: 20),

            if (_loading)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Center(
                  child: CircularProgressIndicator(
                    color: AppColors.workerAccent,
                  ),
                ),
              )
            else if (_error != null)
              Center(
                child: Text(
                  _error!,
                  style: const TextStyle(color: AppColors.error),
                ),
              )
            else if (_orders.isEmpty)
              Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  children: [
                    Icon(
                      Icons.history,
                      size: 40,
                      color: AppColors.secondaryText,
                    ),
                    SizedBox(height: 12),
                    Text(
                      'No job history yet',
                      style: TextStyle(
                        color: AppColors.heading,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              )
            else
              ..._orders.map(
                (order) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: WorkOrderCard(
                    workOrder: order,
                    onTap: () => _openOrder(order),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
