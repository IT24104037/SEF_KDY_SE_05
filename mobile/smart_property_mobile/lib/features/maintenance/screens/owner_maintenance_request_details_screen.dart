import 'package:flutter/material.dart';

import '../services/maintenance_service.dart';

class OwnerMaintenanceRequestDetailsScreen extends StatefulWidget {
  final String token;
  final int requestId;

  const OwnerMaintenanceRequestDetailsScreen({
    super.key,
    required this.token,
    required this.requestId,
  });

  @override
  State<OwnerMaintenanceRequestDetailsScreen> createState() =>
      _OwnerMaintenanceRequestDetailsScreenState();
}

class _OwnerMaintenanceRequestDetailsScreenState
    extends State<OwnerMaintenanceRequestDetailsScreen> {
  final MaintenanceService _maintenanceService = MaintenanceService();

  bool _isLoading = true;
  bool _isUpdating = false;

  String? _errorMessage;

  Map<String, dynamic>? _request;
  List<dynamic> _history = [];

  final TextEditingController _noteController = TextEditingController();

  String? _selectedStatus;

  @override
  void initState() {
    super.initState();
    _loadDetails();
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _loadDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final request = await _maintenanceService.getRequestById(
        token: widget.token,
        id: widget.requestId,
      );

      final history = await _maintenanceService.getHistory(
        token: widget.token,
        id: widget.requestId,
      );

      setState(() {
        _request = Map<String, dynamic>.from(request);
        _history = history;
        _selectedStatus = _request?['status']?.toString();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _updateStatus() async {
    if (_selectedStatus == null) {
      return;
    }

    setState(() {
      _isUpdating = true;
    });

    try {
      await _maintenanceService.updateRequestStatus(
        token: widget.token,
        requestId: widget.requestId,
        status: _selectedStatus!,
        note: _noteController.text.trim().isEmpty
            ? null
            : _noteController.text.trim(),
      );

      _noteController.clear();

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Request status updated successfully.'),
        ),
      );

      await _loadDetails();
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isUpdating = false;
        });
      }
    }
  }

  Widget _infoRow(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value?.toString() ?? '-',
            ),
          ),
        ],
      ),
    );
  }

  List<String> _extractImageUrls() {
    final images = _request?['images'];

    if (images is! List) {
      return [];
    }

    return images
        .map((image) {
          if (image is String) {
            return image;
          }

          if (image is Map) {
            return image['imageUrl']?.toString() ??
                image['url']?.toString() ??
                '';
          }

          return '';
        })
        .where((url) => url.isNotEmpty)
        .toList();
  }

  Widget _buildImages() {
    final imageUrls = _extractImageUrls();

    if (imageUrls.isEmpty) {
      return const Text('No images available.');
    }

    return SizedBox(
      height: 180,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: imageUrls.length,
       separatorBuilder: (context, index) =>
          const SizedBox(width: 10),
        itemBuilder: (context, index) {
          return ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.network(
              imageUrls[index],
              width: 220,
              height: 180,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: 220,
                  height: 180,
                  alignment: Alignment.center,
                  color: Colors.grey.shade200,
                  child: const Text(
                    'Unable to load image',
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildHistory() {
    if (_history.isEmpty) {
      return const Text('No status history available.');
    }

    return Column(
      children: _history.map((item) {
        final oldStatus =
            item['oldStatus']?.toString() ?? '-';

        final newStatus =
            item['newStatus']?.toString() ?? '-';

        final note =
            item['note']?.toString();

        final changedAt =
            item['changedAt']?.toString() ??
                item['createdAt']?.toString() ??
                '-';

        return Card(
          child: ListTile(
            leading: const Icon(Icons.history),
            title: Text(
              '$oldStatus → $newStatus',
            ),
            subtitle: Text(
              '${note == null || note.isEmpty ? 'No note' : note}\n'
              '$changedAt',
            ),
          ),
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Request #${widget.requestId}',
        ),
        actions: [
          IconButton(
            onPressed: _loadDetails,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: _isLoading
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
                          onPressed: _loadDetails,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : _request == null
                  ? const Center(
                      child: Text('Request not found.'),
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment:
                            CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Request Information',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),

                          _infoRow(
                            'Status',
                            _request?['status'],
                          ),
                          _infoRow(
                            'Type',
                            _request?['requestType'],
                          ),
                          _infoRow(
                            'Priority',
                            _request?['priority'] ??
                                'Not Assigned',
                          ),
                          _infoRow(
                            'Category',
                            _request?['categoryName'] ??
                                _request?['category']
                                    ?['name'] ??
                                'Not Assigned',
                          ),
                          _infoRow(
                            'Emergency',
                            _request?['emergencyType'] ??
                                '-',
                          ),
                          _infoRow(
                            'Property',
                            _request?['propertyName'] ??
                                _request?['property']
                                    ?['name'] ??
                                '-',
                          ),
                          _infoRow(
                            'Unit',
                            _request?['unitName'] ??
                                _request?['unitNumber'] ??
                                _request?['unit']
                                    ?['unitNumber'] ??
                                '-',
                          ),
                          _infoRow(
                            'Created',
                            _request?['createdAt'],
                          ),

                          const SizedBox(height: 20),

                          const Text(
                            'Description',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),

                          Text(
                            _request?['description']
                                    ?.toString() ??
                                '-',
                          ),

                          const SizedBox(height: 24),

                          const Text(
                            'Photos',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 10),

                          _buildImages(),

                          const SizedBox(height: 24),

                          const Text(
                            'Update Status',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),

                          DropdownButtonFormField<String>(
                            initialValue: _selectedStatus,
                            decoration: const InputDecoration(
                              labelText: 'Status',
                              border: OutlineInputBorder(),
                            ),
                            items: const [
                              DropdownMenuItem(
                                value: 'Submitted',
                                child: Text('Submitted'),
                              ),
                              DropdownMenuItem(
                                value: 'NeedsMoreInfo',
                                child: Text('Needs More Info'),
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
                              DropdownMenuItem(
                                value: 'Emergency',
                                child: Text('Emergency'),
                              ),
                            ],
                            onChanged: (value) {
                              setState(() {
                                _selectedStatus = value;
                              });
                            },
                          ),

                          const SizedBox(height: 12),

                          TextField(
                            controller: _noteController,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              labelText: 'Status note',
                              hintText:
                                  'Optional note about this update',
                              border: OutlineInputBorder(),
                            ),
                          ),

                          const SizedBox(height: 12),

                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _isUpdating
                                  ? null
                                  : _updateStatus,
                              child: _isUpdating
                                  ? const SizedBox(
                                      width: 20,
                                      height: 20,
                                      child:
                                          CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text(
                                      'Update Status',
                                    ),
                            ),
                          ),

                          const SizedBox(height: 24),

                          const Text(
                            'Status History',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 10),

                          _buildHistory(),
                        ],
                      ),
                    ),
    );
  }
}