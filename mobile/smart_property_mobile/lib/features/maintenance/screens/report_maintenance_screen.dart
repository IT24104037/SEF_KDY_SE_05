import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../services/image_picker_service.dart';
import '../services/maintenance_service.dart';

class ReportMaintenanceScreen extends StatefulWidget {
  final String token;

  const ReportMaintenanceScreen({super.key, required this.token});

  @override
  State<ReportMaintenanceScreen> createState() =>
      _ReportMaintenanceScreenState();
}

class _ReportMaintenanceScreenState extends State<ReportMaintenanceScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();

  final MaintenanceService _maintenanceService = MaintenanceService();

  final ImagePickerService _imagePickerService = ImagePickerService();

  XFile? _selectedImage;

  bool _submitting = false;
  String? _errorMessage;
  String? _successMessage;

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickFromGallery() async {
    final image = await _imagePickerService.pickFromGallery();

    if (image != null) {
      setState(() {
        _selectedImage = image;
        _errorMessage = null;
      });
    }
  }

  Future<void> _takePhoto() async {
    final image = await _imagePickerService.takePhoto();

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

    if (_selectedImage == null) {
      setState(() {
        _errorMessage = 'A photo is required for a normal maintenance request.';
      });

      return;
    }

    try {
      setState(() {
        _submitting = true;
        _errorMessage = null;
        _successMessage = null;
      });

      // Step 1: Upload image.
      final imageUrl = await _maintenanceService.uploadImage(
        file: _selectedImage!,
        token: widget.token,
      );

      // Step 2: Create maintenance request.
      final result = await _maintenanceService.createMaintenanceRequest(
        token: widget.token,
        description: _descriptionController.text.trim(),
        requestType: 'NORMAL',
        imageUrl: imageUrl,
      );

      if (!mounted) return;

      setState(() {
        _successMessage =
            'Maintenance request #${result['id']} submitted successfully.';

        _descriptionController.clear();
        _selectedImage = null;
      });
    } catch (error) {
      if (!mounted) return;

      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
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
      appBar: AppBar(title: const Text('Report Maintenance')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Report a Maintenance Problem',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                ),

                const SizedBox(height: 8),

                const Text(
                  'Your property and unit will be identified automatically from your active tenancy.',
                ),

                const SizedBox(height: 24),

                TextFormField(
                  controller: _descriptionController,
                  maxLength: 1000,
                  maxLines: 5,
                  decoration: const InputDecoration(
                    labelText: 'Problem Description',
                    hintText:
                        'Example: Water is leaking under the kitchen sink.',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please describe the maintenance problem.';
                    }

                    return null;
                  },
                ),

                const SizedBox(height: 20),

                const Text(
                  'Photo *',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),

                const SizedBox(height: 10),

                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _submitting ? null : _takePhoto,
                        icon: const Icon(Icons.camera_alt),
                        label: const Text('Camera'),
                      ),
                    ),

                    const SizedBox(width: 10),

                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _submitting ? null : _pickFromGallery,
                        icon: const Icon(Icons.photo_library),
                        label: const Text('Gallery'),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                if (_selectedImage != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Image.file(
                      File(_selectedImage!.path),
                      width: double.infinity,
                      height: 250,
                      fit: BoxFit.cover,
                    ),
                  )
                else
                  Container(
                    width: double.infinity,
                    height: 160,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text('No photo selected'),
                  ),

                if (_errorMessage != null) ...[
                  const SizedBox(height: 20),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: Colors.red.shade700),
                    ),
                  ),
                ],

                if (_successMessage != null) ...[
                  const SizedBox(height: 20),

                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _successMessage!,
                      style: TextStyle(color: Colors.green.shade700),
                    ),
                  ),
                ],

                const SizedBox(height: 25),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _submitting ? null : _submit,
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Text(
                        _submitting
                            ? 'Submitting...'
                            : 'Submit Maintenance Request',
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
