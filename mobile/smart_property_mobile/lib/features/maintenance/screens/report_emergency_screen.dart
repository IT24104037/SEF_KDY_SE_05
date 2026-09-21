import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../services/image_picker_service.dart';
import '../services/maintenance_service.dart';

class ReportEmergencyScreen extends StatefulWidget {
  final String token;

  const ReportEmergencyScreen({
    super.key,
    required this.token,
  });

  @override
  State<ReportEmergencyScreen> createState() =>
      _ReportEmergencyScreenState();
}

class _ReportEmergencyScreenState
    extends State<ReportEmergencyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();

  final MaintenanceService _maintenanceService =
      MaintenanceService();

  final ImagePickerService _imagePickerService =
      ImagePickerService();

  String? _emergencyType;
  XFile? _selectedImage;

  bool _submitting = false;
  String? _errorMessage;
  String? _successMessage;

  final List<String> _emergencyTypes = [
    'Major Water Leak',
    'Electrical Hazard',
    'Fire or Smoke',
    'Gas Leak',
    'Security Issue',
    'Other',
  ];

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickFromGallery() async {
    final image =
        await _imagePickerService.pickFromGallery();

    if (image != null) {
      setState(() {
        _selectedImage = image;
        _errorMessage = null;
      });
    }
  }

  Future<void> _takePhoto() async {
    final image =
        await _imagePickerService.takePhoto();

    if (image != null) {
      setState(() {
        _selectedImage = image;
        _errorMessage = null;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    try {
      setState(() {
        _submitting = true;
        _errorMessage = null;
        _successMessage = null;
      });

      String? imageUrl;

      // Photo is optional for emergency.
      if (_selectedImage != null) {
        imageUrl =
            await _maintenanceService.uploadImage(
          file: _selectedImage!,
          token: widget.token,
        );
      }

      final result =
          await _maintenanceService.createMaintenanceRequest(
        token: widget.token,
        description:
            _descriptionController.text.trim(),
        requestType: 'EMERGENCY',
        emergencyType: _emergencyType,
        imageUrl: imageUrl,
      );

      if (!mounted) return;

      setState(() {
        _successMessage =
            'Emergency request #${result['id']} submitted successfully.';

        _descriptionController.clear();
        _emergencyType = null;
        _selectedImage = null;
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
          _submitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Report Emergency'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment:
                  CrossAxisAlignment.start,
              children: [
                const Text(
                  'Emergency Maintenance',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 8),

                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius:
                        BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'Emergency requests are treated as Critical priority.',
                  ),
                ),

                const SizedBox(height: 24),

                DropdownButtonFormField<String>(
                  initialValue: _emergencyType,
                  decoration: const InputDecoration(
                    labelText: 'Emergency Type',
                    border:
                        OutlineInputBorder(),
                  ),
                  items: _emergencyTypes
                      .map(
                        (type) =>
                            DropdownMenuItem(
                          value: type,
                          child: Text(type),
                        ),
                      )
                      .toList(),
                  onChanged: _submitting
                      ? null
                      : (value) {
                          setState(() {
                            _emergencyType =
                                value;
                          });
                        },
                  validator: (value) {
                    if (value == null ||
                        value.isEmpty) {
                      return 'Please select an emergency type.';
                    }

                    return null;
                  },
                ),

                const SizedBox(height: 20),

                TextFormField(
                  controller:
                      _descriptionController,
                  maxLength: 1000,
                  maxLines: 5,
                  decoration:
                      const InputDecoration(
                    labelText: 'Description',
                    hintText:
                        'Describe the emergency and where it is happening.',
                    border:
                        OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null ||
                        value.trim().isEmpty) {
                      return 'Please describe the emergency.';
                    }

                    return null;
                  },
                ),

                const SizedBox(height: 20),

                const Text(
                  'Photo (Optional)',
                  style: TextStyle(
                    fontWeight:
                        FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed:
                            _submitting
                                ? null
                                : _takePhoto,
                        icon: const Icon(
                          Icons.camera_alt,
                        ),
                        label: const Text(
                          'Camera',
                        ),
                      ),
                    ),

                    const SizedBox(width: 10),

                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed:
                            _submitting
                                ? null
                                : _pickFromGallery,
                        icon: const Icon(
                          Icons.photo_library,
                        ),
                        label: const Text(
                          'Gallery',
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                if (_selectedImage != null)
                  ClipRRect(
                    borderRadius:
                        BorderRadius.circular(10),
                    child: Image.file(
                      File(
                        _selectedImage!.path,
                      ),
                      width: double.infinity,
                      height: 250,
                      fit: BoxFit.cover,
                    ),
                  )
                else
                  Container(
                    width: double.infinity,
                    height: 120,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: Colors.grey,
                      ),
                      borderRadius:
                          BorderRadius.circular(
                        10,
                      ),
                    ),
                    child: const Text(
                      'No photo selected',
                    ),
                  ),

                if (_errorMessage != null) ...[
                  const SizedBox(height: 20),

                  Text(
                    _errorMessage!,
                    style: const TextStyle(
                      color: Colors.red,
                    ),
                  ),
                ],

                if (_successMessage != null) ...[
                  const SizedBox(height: 20),

                  Text(
                    _successMessage!,
                    style: const TextStyle(
                      color: Colors.green,
                    ),
                  ),
                ],

                const SizedBox(height: 25),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed:
                        _submitting
                            ? null
                            : _submit,
                    child: Padding(
                      padding:
                          const EdgeInsets.all(
                        14,
                      ),
                      child: Text(
                        _submitting
                            ? 'Submitting...'
                            : 'Submit Emergency Request',
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}