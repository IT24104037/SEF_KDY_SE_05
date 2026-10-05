import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/tenancy_service.dart';
import 'tenant_home_screen.dart';

class TenancyHistoryScreen extends StatefulWidget {
  const TenancyHistoryScreen({super.key});

  @override
  State<TenancyHistoryScreen> createState() => _TenancyHistoryScreenState();
}

class _TenancyHistoryScreenState extends State<TenancyHistoryScreen> {
  final TenancyService _service = TenancyService.instance;

  List<Map<String, dynamic>> _items = [];

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
      final items = await _service.getTenancyHistory();

      if (!mounted) return;

      setState(() {
        _items = items;
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

  String _date(dynamic value) {
    if (value == null) return 'Present';

    final date = DateTime.tryParse(value.toString());

    if (date == null) {
      return value.toString();
    }

    return '${date.day.toString().padLeft(2, '0')}/'
        '${date.month.toString().padLeft(2, '0')}/'
        '${date.year}';
  }

  String _status(dynamic value) {
    if (value == null) return '-';

    if (value == 0 || value == '0') {
      return 'Active';
    }

    if (value == 1 || value == '1') {
      return 'Ended';
    }

    return value.toString();
  }

  @override
  Widget build(BuildContext context) {
    return RoleScaffold(
      title: 'Tenancy History',
      roleLabel: 'Tenant',
      expectedRole: 'Tenant',
      accentColor: AppColors.tenantAccent,
      menuItems: TenantHomeScreen.menuItems,
      currentRoute: AppRoutes.tenantTenancyHistory,
      showBackButton: true,
      child: RefreshIndicator(
        color: AppColors.tenantAccent,
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            const Text(
              'Tenancy History',
              style: TextStyle(
                color: AppColors.heading,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 20),

            if (_loading)
              const Center(
                child: CircularProgressIndicator(color: AppColors.tenantAccent),
              )
            else if (_error != null)
              Text(_error!, style: const TextStyle(color: AppColors.error))
            else if (_items.isEmpty)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  border: Border.all(color: AppColors.border),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'No tenancies to show.',
                  style: TextStyle(color: AppColors.secondaryText),
                ),
              )
            else
              ..._items.map((item) {
                final status = _status(item['status']);

                final active = status == 'Active';

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    border: Border.all(color: AppColors.border),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Unit ${item['unitName'] ?? item['unitId'] ?? '-'}',
                              style: const TextStyle(
                                color: AppColors.heading,
                                fontWeight: FontWeight.w700,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${_date(item['startDate'])} — ${_date(item['endDate'])}',
                              style: const TextStyle(
                                color: AppColors.secondaryText,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 5,
                        ),
                        decoration: BoxDecoration(
                          color: active
                              ? AppColors.successBackground
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          status,
                          style: TextStyle(
                            color: active
                                ? AppColors.success
                                : const Color(0xFF475569),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
