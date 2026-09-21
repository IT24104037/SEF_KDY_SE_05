import 'package:flutter/material.dart';

import '../services/maintenance_service.dart';
import 'owner_maintenance_request_details_screen.dart';

class OwnerMaintenanceRequestsScreen extends StatefulWidget {
  final String token;

  const OwnerMaintenanceRequestsScreen({
    super.key,
    required this.token,
  });

  @override
  State<OwnerMaintenanceRequestsScreen> createState() =>
      _OwnerMaintenanceRequestsScreenState();
}

class _OwnerMaintenanceRequestsScreenState
    extends State<OwnerMaintenanceRequestsScreen> {
  final MaintenanceService _maintenanceService = MaintenanceService();

  bool _isLoading = true;
  String? _errorMessage;

  List<dynamic> _requests = [];

  String? _selectedStatus;
  String? _selectedType;

  int _page = 1;
  final int _pageSize = 10;

  @override
  void initState() {
    super.initState();
    _loadRequests();
  }

  Future<void> _loadRequests() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _maintenanceService.getRequests(
        token: widget.token,
        page: _page,
        pageSize: _pageSize,
        status: _selectedStatus,
        requestType: _selectedType,
      );

      final data = result['items'] ??
          result['requests'] ??
          result['data'] ??
          [];

      setState(() {
        _requests = data is List ? data : [];
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Color _statusColor(String status) {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'closed':
        return Colors.green;
      case 'emergency':
        return Colors.red;
      case 'inprogress':
      case 'in progress':
        return Colors.orange;
      case 'cancelled':
        return Colors.grey;
      default:
        return Colors.blue;
    }
  }

  Widget _buildRequestCard(dynamic request) {
    final id = request['id'] ?? '-';
    final status = request['status']?.toString() ?? 'Unknown';
    final type = request['requestType']?.toString() ?? 'NORMAL';
    final priority = request['priority']?.toString() ?? 'Not Assigned';
    final description =
        request['description']?.toString() ?? 'No description provided';

    final unit = request['unitName'] ??
        request['unitNumber'] ??
        request['unit']?['name'] ??
        request['unit']?['unitNumber'] ??
        '-';

    return Card(
      margin: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 8,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Request #$id',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: _statusColor(status).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    status,
                    style: TextStyle(
                      color: _statusColor(status),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text('Unit: $unit'),
            Text('Type: $type'),
            Text('Priority: $priority'),
            const SizedBox(height: 8),
            Text(
              description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: OutlinedButton(
                onPressed: () async {
                  await Navigator.push(
                    context,
                   MaterialPageRoute(
                    builder: (_) =>
                      OwnerMaintenanceRequestDetailsScreen(
                    token: widget.token,
                    requestId: id is int
                     ? id
                     : int.parse(id.toString()),
               ),
              ),
            );

           _loadRequests();
        },
                
                child: const Text('View Details'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Property Maintenance Requests'),
        actions: [
          IconButton(
            onPressed: _loadRequests,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String?>(
                    initialValue: _selectedStatus,
                    decoration: const InputDecoration(
                      labelText: 'Status',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: null,
                        child: Text('All'),
                      ),
                      DropdownMenuItem(
                        value: 'Submitted',
                        child: Text('Submitted'),
                      ),
                      DropdownMenuItem(
                        value: 'InProgress',
                        child: Text('In Progress'),
                      ),
                      DropdownMenuItem(
                        value: 'Completed',
                        child: Text('Completed'),
                      ),
                      DropdownMenuItem(
                        value: 'Cancelled',
                        child: Text('Cancelled'),
                      ),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _selectedStatus = value;
                        _page = 1;
                      });

                      _loadRequests();
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: DropdownButtonFormField<String?>(
                    initialValue: _selectedType,
                    decoration: const InputDecoration(
                      labelText: 'Type',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: null,
                        child: Text('All'),
                      ),
                      DropdownMenuItem(
                        value: 'NORMAL',
                        child: Text('Normal'),
                      ),
                      DropdownMenuItem(
                        value: 'EMERGENCY',
                        child: Text('Emergency'),
                      ),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _selectedType = value;
                        _page = 1;
                      });

                      _loadRequests();
                    },
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(),
                  )
                : _errorMessage != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                _errorMessage!,
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 12),
                              ElevatedButton(
                                onPressed: _loadRequests,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _requests.isEmpty
                        ? const Center(
                            child: Text(
                              'No maintenance requests found.',
                            ),
                          )
                        : RefreshIndicator(
                            onRefresh: _loadRequests,
                            child: ListView.builder(
                              itemCount: _requests.length,
                              itemBuilder: (context, index) {
                                return _buildRequestCard(
                                  _requests[index],
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }
}