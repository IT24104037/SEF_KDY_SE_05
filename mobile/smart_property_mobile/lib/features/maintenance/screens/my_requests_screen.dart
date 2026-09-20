import 'package:flutter/material.dart';
import 'request_details_screen.dart';
import '../services/maintenance_service.dart';

class MyRequestsScreen extends StatefulWidget {
  final String token;

  const MyRequestsScreen({
    super.key,
    required this.token,
  });

  @override
  State<MyRequestsScreen> createState() =>
      _MyRequestsScreenState();
}

class _MyRequestsScreenState
    extends State<MyRequestsScreen> {
  final MaintenanceService _maintenanceService =
      MaintenanceService();

  List<dynamic> _requests = [];

  bool _loading = true;
  String? _errorMessage;

  String _status = '';
  String _requestType = '';

  int _page = 1;
  int _totalPages = 0;
  int _totalCount = 0;

  @override
  void initState() {
    super.initState();
    _loadRequests();
  }

  Future<void> _loadRequests() async {
    try {
      setState(() {
        _loading = true;
        _errorMessage = null;
      });

      final result =
          await _maintenanceService.getRequests(
        token: widget.token,
        page: _page,
        pageSize: 10,
        status:
            _status.isEmpty ? null : _status,
        requestType:
            _requestType.isEmpty
                ? null
                : _requestType,
      );

      if (!mounted) return;

      setState(() {
        _requests =
            result['requests'] as List<dynamic>? ??
                [];

        _totalPages =
            result['totalPages'] as int? ?? 0;

        _totalCount =
            result['totalCount'] as int? ?? 0;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _errorMessage =
            error.toString().replaceFirst(
                  'Exception: ',
                  '',
                );
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  String _formatDate(dynamic value) {
    if (value == null) {
      return '-';
    }

    final date = DateTime.tryParse(
      value.toString(),
    );

    if (date == null) {
      return value.toString();
    }

    return date.toLocal().toString().split('.')[0];
  }

  Widget _buildRequestCard(
  Map<String, dynamic> request,
) {
  final requestType =
      request['requestType']?.toString() ?? '-';

  final status =
      request['status']?.toString() ?? '-';

  final category =
      request['categoryName']?.toString();

  final priority =
      request['priority']?.toString();

  return Card(
    margin: const EdgeInsets.only(
      bottom: 14,
    ),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment:
            CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment:
                MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Request #${request['id']}',
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                status,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          Text(
            requestType,
            style: TextStyle(
              color:
                  requestType == 'EMERGENCY'
                      ? Colors.red
                      : Colors.blueGrey,
              fontWeight: FontWeight.w600,
            ),
          ),

          const SizedBox(height: 10),

          Text(
            request['description']?.toString() ??
                '-',
          ),

          const SizedBox(height: 12),

          Text(
            'Category: ${category ?? 'Not analysed'}',
          ),

          Text(
            'Priority: ${priority ?? 'Pending'}',
          ),

          Text(
            'Submitted: ${_formatDate(request['createdAt'])}',
          ),

          const SizedBox(height: 12),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        RequestDetailsScreen(
                      token: widget.token,
                      requestId:
                          request['id'] as int,
                    ),
                  ),
                ).then((_) {
                  if (mounted) {
                    _loadRequests();
                  }
                });
              },
              child: const Text(
                'View Details',
              ),
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
        title:
            const Text('My Requests'),
        actions: [
          IconButton(
            onPressed:
                _loading
                    ? null
                    : _loadRequests,
            icon:
                const Icon(Icons.refresh),
          ),
        ],
      ),

      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding:
                  const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment
                        .start,
                children: [
                  Text(
                    'Total Requests: $_totalCount',
                    style:
                        const TextStyle(
                      fontWeight:
                          FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child:
                            DropdownButtonFormField<
                                String>(
                          initialValue:
                              _status,
                          decoration:
                              const InputDecoration(
                            labelText:
                                'Status',
                            border:
                                OutlineInputBorder(),
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: '',
                              child: Text(
                                'All Status',
                              ),
                            ),
                            DropdownMenuItem(
                              value:
                                  'Submitted',
                              child: Text(
                                'Submitted',
                              ),
                            ),
                            DropdownMenuItem(
                              value:
                                  'Emergency',
                              child: Text(
                                'Emergency',
                              ),
                            ),
                            DropdownMenuItem(
                              value:
                                  'Analysing',
                              child: Text(
                                'Analysing',
                              ),
                            ),
                            DropdownMenuItem(
                              value:
                                  'Assigned',
                              child: Text(
                                'Assigned',
                              ),
                            ),
                            DropdownMenuItem(
                              value:
                                  'InProgress',
                              child: Text(
                                'In Progress',
                              ),
                            ),
                            DropdownMenuItem(
                              value:
                                  'Completed',
                              child: Text(
                                'Completed',
                              ),
                            ),
                            DropdownMenuItem(
                              value:
                                  'Cancelled',
                              child: Text(
                                'Cancelled',
                              ),
                            ),
                          ],
                          onChanged:
                              (value) {
                            setState(() {
                              _status =
                                  value ?? '';
                              _page = 1;
                            });

                            _loadRequests();
                          },
                        ),
                      ),

                      const SizedBox(
                        width: 10,
                      ),

                      Expanded(
                        child:
                            DropdownButtonFormField<
                                String>(
                          initialValue:
                              _requestType,
                          decoration:
                              const InputDecoration(
                            labelText: 'Type',
                            border:
                                OutlineInputBorder(),
                          ),
                          items: const [
                            DropdownMenuItem(
                              value: '',
                              child:
                                  Text(
                                'All Types',
                              ),
                            ),
                            DropdownMenuItem(
                              value:
                                  'NORMAL',
                              child:
                                  Text(
                                'Normal',
                              ),
                            ),
                            DropdownMenuItem(
                              value:
                                  'EMERGENCY',
                              child:
                                  Text(
                                'Emergency',
                              ),
                            ),
                          ],
                          onChanged:
                              (value) {
                            setState(() {
                              _requestType =
                                  value ?? '';
                              _page = 1;
                            });

                            _loadRequests();
                          },
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            if (_errorMessage != null)
              Padding(
                padding:
                    const EdgeInsets.symmetric(
                  horizontal: 16,
                ),
                child: Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.all(
                    12,
                  ),
                  color:
                      Colors.red.shade50,
                  child: Text(
                    _errorMessage!,
                    style: TextStyle(
                      color:
                          Colors.red.shade700,
                    ),
                  ),
                ),
              ),

            Expanded(
              child: _loading
                  ? const Center(
                      child:
                          CircularProgressIndicator(),
                    )
                  : _requests.isEmpty
                      ? const Center(
                          child: Text(
                            'No maintenance requests found.',
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh:
                              _loadRequests,
                          child:
                              ListView.builder(
                            padding:
                                const EdgeInsets
                                    .all(16),
                            itemCount:
                                _requests
                                    .length,
                            itemBuilder:
                                (context,
                                    index) {
                              final request =
                                  Map<String,
                                      dynamic>.from(
                                _requests[
                                    index],
                              );

                              return _buildRequestCard(
                                request,
                              );
                            },
                          ),
                        ),
            ),

            if (!_loading)
              Padding(
                padding:
                    const EdgeInsets.all(
                  16,
                ),
                child: Row(
                  mainAxisAlignment:
                      MainAxisAlignment
                          .spaceBetween,
                  children: [
                    OutlinedButton(
                      onPressed: _page > 1
                          ? () {
                              setState(() {
                                _page--;
                              });

                              _loadRequests();
                            }
                          : null,
                      child:
                          const Text(
                        'Previous',
                      ),
                    ),

                    Text(
                      'Page $_page of ${_totalPages == 0 ? 1 : _totalPages}',
                    ),

                    OutlinedButton(
                      onPressed:
                          _totalPages > 0 &&
                                  _page <
                                      _totalPages
                              ? () {
                                  setState(
                                      () {
                                    _page++;
                                  });

                                  _loadRequests();
                                }
                              : null,
                      child:
                          const Text(
                        'Next',
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}