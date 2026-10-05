import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/worker_service.dart';
import '../widgets/work_order_card.dart';
import 'worker_dashboard_screen.dart';

class MyJobsScreen extends StatefulWidget {
  const MyJobsScreen({super.key});

  @override
  State<MyJobsScreen> createState() => _MyJobsScreenState();
}

class _MyJobsScreenState extends State<MyJobsScreen> {
  final WorkerService _service = WorkerService.instance;

  List<Map<String, dynamic>> _orders = [];

  bool _loading = true;
  String? _error;
  String _filter = 'Active';

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
        _orders = orders;
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

  List<Map<String, dynamic>> get _visibleOrders {
    switch (_filter) {
      case 'Assigned':
        return _orders.where((item) => item['status'] == 'Assigned').toList();

      case 'In Progress':
        return _orders.where((item) => item['status'] == 'InProgress').toList();

      case 'All':
        return _orders;

      case 'Active':
      default:
        return _orders.where((item) {
          final status = item['status']?.toString();

          return status != 'Completed' && status != 'Cancelled';
        }).toList();
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
      title: 'My Jobs',
      roleLabel: 'Maintenance Worker',
      expectedRole: 'MaintenanceWorker',
      accentColor: AppColors.workerAccent,
      menuItems: WorkerDashboardScreen.menuItems,
      currentRoute: AppRoutes.workerJobs,
      showBackButton: true,

      child: RefreshIndicator(
        color: AppColors.workerAccent,
        onRefresh: _load,

        child: ListView(
          padding: const EdgeInsets.all(20),

          children: [
            const Text(
              'My Jobs',
              style: TextStyle(
                color: AppColors.heading,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),

            const SizedBox(height: 6),

            const Text(
              'View and manage your assigned maintenance work orders.',
              style: TextStyle(color: AppColors.secondaryText, fontSize: 14),
            ),

            const SizedBox(height: 18),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                for (final filter in [
                  'Active',
                  'Assigned',
                  'In Progress',
                  'All',
                ])
                  ChoiceChip(
                    label: Text(filter),
                    selected: _filter == filter,
                    selectedColor: AppColors.workerAccent.withValues(
                      alpha: 0.14,
                    ),
                    labelStyle: TextStyle(
                      color: _filter == filter
                          ? AppColors.workerAccent
                          : AppColors.secondaryText,
                      fontWeight: FontWeight.w600,
                    ),
                    onSelected: (_) {
                      setState(() {
                        _filter = filter;
                      });
                    },
                  ),
              ],
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
              _MessageCard(message: _error!, isError: true, onRetry: _load)
            else if (_visibleOrders.isEmpty)
              const _EmptyCard()
            else
              ..._visibleOrders.map(
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

class _EmptyCard extends StatelessWidget {
  const _EmptyCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: const Column(
        children: [
          Icon(Icons.work_outline, size: 40, color: AppColors.secondaryText),
          SizedBox(height: 12),
          Text(
            'No jobs found',
            style: TextStyle(
              color: AppColors.heading,
              fontWeight: FontWeight.w700,
              fontSize: 17,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'There are no work orders matching this filter.',
            textAlign: TextAlign.center,
            style: TextStyle(color: AppColors.secondaryText),
          ),
        ],
      ),
    );
  }
}

class _MessageCard extends StatelessWidget {
  const _MessageCard({
    required this.message,
    required this.isError,
    required this.onRetry,
  });

  final String message;
  final bool isError;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isError ? AppColors.errorBackground : AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isError ? AppColors.errorBorder : AppColors.border,
        ),
      ),
      child: Column(
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: TextStyle(color: isError ? AppColors.error : AppColors.text),
          ),
          const SizedBox(height: 12),
          TextButton(onPressed: onRetry, child: const Text('Try Again')),
        ],
      ),
    );
  }
}
