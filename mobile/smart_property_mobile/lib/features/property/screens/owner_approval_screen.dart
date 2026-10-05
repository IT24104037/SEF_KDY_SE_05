import 'package:flutter/material.dart';

import '../../../app/app_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/role_scaffold.dart';
import '../services/property_service.dart';
import '../widgets/owner_ai_widgets.dart';
import 'owner_dashboard_screen.dart';
import 'owner_recommendation_screen.dart';

class OwnerApprovalScreen extends StatefulWidget {
  const OwnerApprovalScreen({super.key, this.workflowOnly = false});

  final bool workflowOnly;

  @override
  State<OwnerApprovalScreen> createState() => _OwnerApprovalScreenState();
}

class _OwnerApprovalScreenState extends State<OwnerApprovalScreen> {
  final PropertyService _service = PropertyService.instance;

  final TextEditingController _searchController = TextEditingController();

  List<Map<String, dynamic>> _requests = [];

  bool _loading = true;
  String? _error;

  int _page = 1;
  int _totalPages = 1;
  int _loadGeneration = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  bool _isPending(Map<String, dynamic> request) {
    if (request['isArchived'] == true || request['workOrderId'] != null) {
      return false;
    }

    final status = ownerAiText(request['status'])
        .toLowerCase()
        .replaceAll(' ', '');

    return !const [
      'assigned',
      'inprogress',
      'completed',
      'cancelled',
      'closed',
    ].contains(status);
  }

  Future<void> _load({int? page}) async {
    if (!mounted) return;

    final generation = ++_loadGeneration;
    final requestedPage = page ?? _page;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      // Load the request list only.
      // Recommendations are loaded when a request is opened.
      final result = await _service.getOwnerAiRequestPage(
        page: requestedPage,
        search: _searchController.text,
      );

      final allRequests = ownerAiList(result['requests']);

      final requests = widget.workflowOnly
          ? allRequests
          : allRequests.where(_isPending).toList();

      final totalPages = int.tryParse('${result['totalPages']}') ?? 1;

      if (!mounted || generation != _loadGeneration) {
        return;
      }

      setState(() {
        _requests = requests;
        _page = requestedPage;
        _totalPages = totalPages;
      });
    } catch (error) {
      if (mounted && generation == _loadGeneration) {
        setState(() {
          _error = error.toString();
        });
      }
    } finally {
      if (mounted && generation == _loadGeneration) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  Future<void> _openRequest(Map<String, dynamic> request) async {
    final requestId = int.tryParse('${request['id']}');

    if (requestId == null || requestId <= 0) {
      return;
    }

    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => OwnerRecommendationScreen(
          requestId: requestId,
          initialRequest: request,
        ),
      ),
    );

    if (mounted) {
      await _load();
    }
  }

  Widget _requestCard(Map<String, dynamic> request) {
    final emergency = request['requestType'] == 'EMERGENCY';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Icon(
          emergency ? Icons.warning_amber_rounded : Icons.auto_awesome_outlined,
          color: emergency ? AppColors.error : AppColors.ownerAccent,
        ),
        title: Text(
          'Request #${request['id']} • '
          '${ownerAiText(request['categoryName'], emergency ? 'Emergency' : 'Maintenance')}',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            '${ownerAiText(request['propertyName'])}'
            ' • Unit ${ownerAiText(request['unitName'])}\n'
            '${ownerAiText(request['description'])}\n'
            '${ownerAiText(request['status'])}',
            maxLines: 5,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: () => _openRequest(request),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final title = widget.workflowOnly ? 'AI Workflow' : 'Owner Approvals';

    return RoleScaffold(
      title: title,
      roleLabel: 'Owner',
      expectedRole: 'PropertyOwner',
      accentColor: AppColors.ownerAccent,
      menuItems: OwnerDashboardScreen.menuItems,
      currentRoute: widget.workflowOnly
          ? AppRoutes.ownerAiWorkflow
          : AppRoutes.ownerApproval,
      showBackButton: true,
      child: RefreshIndicator(
        color: AppColors.ownerAccent,
        onRefresh: _load,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              title,
              style: const TextStyle(
                color: AppColors.heading,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              widget.workflowOnly
                  ? 'Review agent progress for your requests.'
                  : 'Open a pending request to review '
                        'the recommendation or send a manual decision.',
              style: const TextStyle(
                color: AppColors.secondaryText,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 18),
            TextField(
              controller: _searchController,
              enabled: !_loading,
              decoration: InputDecoration(
                labelText: 'Search requests',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  onPressed: _loading ? null : () => _load(page: 1),
                  icon: const Icon(Icons.arrow_forward),
                ),
              ),
              onSubmitted: (_) => _load(page: 1),
            ),
            const SizedBox(height: 18),

            if (_loading)
              const Padding(
                padding: EdgeInsets.all(30),
                child: Center(
                  child: CircularProgressIndicator(
                    color: AppColors.ownerAccent,
                  ),
                ),
              )
            else if (_error != null)
              OwnerAiError(message: _error!, onRetry: _load)
            else if (_requests.isEmpty)
              OwnerAiCard(
                title: 'No Requests on This Page',
                children: [
                  Text(
                    widget.workflowOnly
                        ? 'No matching requests were found.'
                        : 'No pending requests on this page. '
                              'Try another page if available.',
                  ),
                ],
              )
            else
              ..._requests.map(_requestCard),

            if (!_loading && _error == null)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TextButton(
                    onPressed: _page > 1 ? () => _load(page: _page - 1) : null,
                    child: const Text('Previous'),
                  ),
                  Text(
                    'Page $_page of '
                    '${_totalPages < 1 ? 1 : _totalPages}',
                  ),
                  TextButton(
                    onPressed: _page < _totalPages
                        ? () => _load(page: _page + 1)
                        : null,
                    child: const Text('Next'),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
