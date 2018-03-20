module.exports = function(dependencies, lib) {
  const logger = dependencies('logger');

  return {
    load,
    noDuplicateBlobIdPerUser,
    validateAttachmentCreation
  };

  function load(req, res, next) {
    lib.attachment.getById(req.params.attachmentId)
      .then(attachment => {
        if (attachment) {
          req.attachment = attachment;
          next();
        } else {
          res.status(404).json({
            error: {
              code: 404,
              message: 'Not Found',
              details: 'Attachment not found'
            }
          });
        }
      })
      .catch(err => {
        const details = 'Error while loading attachment';

        logger.error(details, err);

        res.status(500).json({
          error: {
            code: 500,
            message: 'Server Error',
            details
          }
        });
      });
  }

  function validateAttachmentCreation(req, res, next) {
    if (!req.body.blobId) {
      return res.status(400).json({
        error: {
          code: 400,
          message: 'Bad Request',
          details: 'blobId is required'
        }
      });
    }

    next();
  }

  function noDuplicateBlobIdPerUser(req, res, next) {
    lib.attachment.list({
      userId: req.user.id,
      blobId: req.body.blobId
    }).then(attachments => {
      if (attachments.length) {
        res.status(409).json({
          error: {
            code: 409,
            message: 'Conflict',
            details: `Attachment with this blobId is already created: ${req.body.blobId}`
          }
        });
      } else {
        next();
      }
    }, err => {
      const details = 'Error while checking blobId of attachment';

      logger.error(details, err);

      res.status(500).json({
        error: {
          code: 500,
          message: 'Server Error',
          details
        }
      });
    });
  }
};
