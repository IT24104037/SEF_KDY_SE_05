import 'package:flutter/material.dart';

import '../services/maintenance_service.dart';

class RequestDetailsScreen extends StatefulWidget {
  final String token;
  final int requestId;

  const RequestDetailsScreen({
    super.key,
    required this.token,
    required this.requestId,
  });

  @override
  State<RequestDetailsScreen> createState() =>
      _RequestDetailsScreenState();
}

class _RequestDetailsScreenState
    extends State<RequestDetailsScreen> {
  final MaintenanceService _maintenanceService =
      MaintenanceService();

  Map<String, dynamic>? _request;
  List<dynamic> _history = [];

  bool _loading = true;
  bool _cancelling = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  Future<void> _loadDetails() async {
    try {
      setState(() {
        _loading = true;
        _errorMessage = null;
      });

      final request =
          await _maintenanceService.getRequestById(
        token: widget.token,
        id: widget.requestId,
      );

      final history =
          await _maintenanceService.getHistory(
        token: widget.token,
        id: widget.requestId,
      );

      if (!mounted) return;

      setState(() {
        _request = request;
        _history = history;
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

  bool _canCancel() {
    final status =
        _request?['status']?.toString();

    return [
      'Submitted',
      'NeedsMoreInfo',
      'Emergency',
    ].contains(status);
  }

  Future<void> _cancelRequest() async {
    final confirmed =
        await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text(
            'Cancel Request',
          ),
          content: const Text(
            'Are you sure you want to cancel this maintenance request?',
          ),
          actions: [
            TextButton(
              onPressed: () =>
                  Navigator.pop(
                context,
                false,
              ),
              child: const Text(
                'No',
              ),
            ),
            ElevatedButton(
              onPressed: () =>
                  Navigator.pop(
                context,
                true,
              ),
              child: const Text(
                'Yes, Cancel',
              ),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    try {
      setState(() {
        _cancelling = true;
        _errorMessage = null;
        _successMessage = null;
      });

      await _maintenanceService.cancelRequest(
        token: widget.token,
        id: widget.requestId,
      );

      if (!mounted) return;

      setState(() {
        _successMessage =
            'Maintenance request cancelled successfully.';
      });

      await _loadDetails();
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
          _cancelling = false;
        });
      }
    }
  }

  String _formatDate(dynamic value) {
    if (value == null) {
      return '-';
    }

    final date =
        DateTime.tryParse(value.toString());

    if (date == null) {
      return value.toString();
    }

    return date.toLocal().toString().split('.')[0];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Request #${widget.requestId}',
        ),
      ),
      body: SafeArea(
        child: _loading
            ? const Center(
                child:
                    CircularProgressIndicator(),
              )
            : _request == null
                ? Center(
                    child: Text(
                      _errorMessage ??
                          'Request not found.',
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: _loadDetails,
                    child:
                        ListView(
                      padding:
                          const EdgeInsets.all(
                        16,
                      ),
                      children: [
                        if (_successMessage != null)
                          Container(
                            padding:
                                const EdgeInsets.all(
                              12,
                            ),
                            margin:
                                const EdgeInsets.only(
                              bottom: 16,
                            ),
                            color:
                                Colors.green.shade50,
                            child: Text(
                              _successMessage!,
                              style: TextStyle(
                                color: Colors
                                    .green.shade700,
                              ),
                            ),
                          ),

                        if (_errorMessage != null)
                          Container(
                            padding:
                                const EdgeInsets.all(
                              12,
                            ),
                            margin:
                                const EdgeInsets.only(
                              bottom: 16,
                            ),
                            color:
                                Colors.red.shade50,
                            child: Text(
                              _errorMessage!,
                              style: TextStyle(
                                color: Colors
                                    .red.shade700,
                              ),
                            ),
                          ),

                        Card(
                          child: Padding(
                            padding:
                                const EdgeInsets.all(
                              16,
                            ),
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment
                                      .start,
                              children: [
                                const Text(
                                  'Request Details',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(
                                  height: 14,
                                ),
                                Text(
                                  'Type: ${_request!['requestType']}',
                                ),
                                Text(
                                  'Status: ${_request!['status']}',
                                ),
                                Text(
                                  'Category: ${_request!['categoryName'] ?? 'Not analysed'}',
                                ),
                                Text(
                                  'Priority: ${_request!['priority'] ?? 'Pending'}',
                                ),
                                if (_request![
                                        'emergencyType'] !=
                                    null)
                                  Text(
                                    'Emergency Type: ${_request!['emergencyType']}',
                                  ),
                                const SizedBox(
                                  height: 12,
                                ),
                                const Text(
                                  'Description',
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(
                                  height: 5,
                                ),
                                Text(
                                  _request![
                                          'description']
                                      .toString(),
                                ),
                                const SizedBox(
                                  height: 12,
                                ),
                                Text(
                                  'Created: ${_formatDate(_request!['createdAt'])}',
                                ),
                                Text(
                                  'Updated: ${_formatDate(_request!['updatedAt'])}',
                                ),
                              ],
                            ),
                          ),
                        ),

                        const SizedBox(height: 14),

                        Card(
                          child: Padding(
                            padding:
                                const EdgeInsets.all(
                              16,
                            ),
                            child: Column(
                              crossAxisAlignment:
                                  CrossAxisAlignment
                                      .start,
                              children: [
                                const Text(
                                  'Photo',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight:
                                        FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(
                                  height: 12,
                                ),
                                if ((_request![
                                            'imageUrls']
                                        as List?)
                                    ?.isNotEmpty ==
                                    true)
                                  ...(_request![
                                              'imageUrls']
                                          as List)
                                      .map(
                                    (url) => Padding(
                                      padding:
                                          const EdgeInsets
                                              .only(
                                        bottom: 10,
                                      ),
                                      child:
                                          Image.network(
                                        url.toString(),
                                        width:
                                            double.infinity,
                                        height: 240,
                                        fit:
                                            BoxFit.cover,
                                        errorBuilder:
                                            (
                                          context,
                                          error,
                                          stackTrace,
                                        ) {
                                          return const Text(
                                            'Unable to load image.',
                                          );
                                        },
                                      ),
                                    ),
                                  )
                                else
                                  const Text(
                                    'No photo available.',
                                  ),
                              ],
                            ),
                          ),
                        ),

                        if (_canCancel()) ...[
                          const SizedBox(
                            height: 14,
                          ),
                          SizedBox(
                            width:
                                double.infinity,
                            child:
                                ElevatedButton(
                              onPressed:
                                  _cancelling
                                      ? null
                                      : _cancelRequest,
                              child: Text(
                                _cancelling
                                    ? 'Cancelling...'
                                    : 'Cancel Request',
                              ),
                            ),
                          ),
                        ],

                        const SizedBox(height: 20),

                        const Text(
                          'Status History',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight:
                                FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 10),

                        if (_history.isEmpty)
                          const Text(
                            'No status history available.',
                          )
                        else
                          ..._history.map(
                            (item) {
                              final historyItem =
                                  Map<String,
                                      dynamic>.from(
                                item,
                              );

                              return Card(
                                child: ListTile(
                                  title: Text(
                                    '${historyItem['oldStatus']?.toString().isEmpty == true ? 'Created' : historyItem['oldStatus']} → ${historyItem['newStatus']}',
                                  ),
                                  subtitle: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment
                                            .start,
                                    children: [
                                      Text(
                                        _formatDate(
                                          historyItem[
                                              'changedAt'],
                                        ),
                                      ),
                                      if (historyItem[
                                              'note'] !=
                                          null)
                                        Text(
                                          historyItem[
                                                  'note']
                                              .toString(),
                                        ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ),
      ),
    );
  }
}