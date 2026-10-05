import 'package:flutter/material.dart';

import '../services/admin_service.dart';
import 'admin_review_screen.dart';

class AdminOwnerVerificationScreen extends StatelessWidget {
  const AdminOwnerVerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AdminReviewScreen(type: AdminReviewType.owners);
  }
}

class AdminWorkerVerificationScreen extends StatelessWidget {
  const AdminWorkerVerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AdminReviewScreen(type: AdminReviewType.workers);
  }
}

class AdminPropertyVerificationScreen extends StatelessWidget {
  const AdminPropertyVerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AdminReviewScreen(type: AdminReviewType.properties);
  }
}

class AdminOwnerProfileRequestsScreen extends StatelessWidget {
  const AdminOwnerProfileRequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const AdminReviewScreen(type: AdminReviewType.ownerProfileRequests);
  }
}
