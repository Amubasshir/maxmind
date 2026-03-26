'use client';

import { Card } from '@/components/ui/card';
import type { MaxMindResponse } from '@/types/minfraud';
import RiskScoreBadge from './RiskScoreBadge';

interface ResultDisplayProps {
  response: MaxMindResponse | null;
  onCopyJson: () => void;
}

export default function ResultDisplay({
  response,
  onCopyJson,
}: ResultDisplayProps) {
  if (!response) {
    return null;
  }

  const billingAddress = response?.billing_address ?? response?.billing;
  const shippingAddress = response?.shipping_address ?? response?.shipping;

  const formatOptionalBool = (value?: boolean) => {
    if (value === undefined) {
      return 'N/A';
    }

    return value ? 'Yes' : 'No';
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Copy JSON Button */}
      {/* <div className="flex justify-end">
        <Button variant="outline" onClick={onCopyJson}>
          Copy JSON
        </Button>
      </div> */}

      {/* Risk Score */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Risk Score</h2>
        <div className="flex items-center justify-center">
          <RiskScoreBadge score={response?.risk_score} />
        </div>
      </Card>

      {/* Risk Score Reasons */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Risk Score Reasons</h3>
        {response?.risk_score_reasons &&
        response?.risk_score_reasons.length > 0 ? (
          <div className="space-y-4">
            {response?.risk_score_reasons.map((reason, index) => (
              <div key={index} className="border-b pb-3 last:border-b-0">
                <div className="font-medium mb-2">
                  Multiplier: {reason.multiplier}
                </div>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {reason.reasons.map((subReason, subIndex) => (
                    <li key={subIndex} className="text-gray-600">
                      {subReason.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No risk score reasons available</p>
        )}
      </Card>

      {/* IP Address Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">IP Address Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium">IP Country:</span>{' '}
            <span className="text-gray-600">
              {response?.ip_address?.country?.iso_code ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">IP City:</span>{' '}
            <span className="text-gray-600">
              {response?.ip_address?.city?.names?.en ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">IP Postal Code:</span>{' '}
            <span className="text-gray-600">
              {response?.ip_address?.postal?.code ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">IP Latitude:</span>{' '}
            <span className="text-gray-600">
              {response?.ip_address?.location?.latitude ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">IP Longitude:</span>{' '}
            <span className="text-gray-600">
              {response?.ip_address?.location?.longitude ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">IP Time Zone:</span>{' '}
            <span className="text-gray-600">
              {response?.ip_address?.location?.time_zone ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">IP ISP:</span>{' '}
            <span className="text-gray-600">
              {response?.ip_address?.traits?.isp ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">IP Organization:</span>{' '}
            <span className="text-gray-600">
              {response?.ip_address?.traits?.organization ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">IP Domain:</span>{' '}
            <span className="text-gray-600">
              {response?.ip_address?.traits?.domain ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">IP User Type:</span>{' '}
            <span className="text-gray-600">
              {response?.ip_address?.traits?.user_type ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">IP Risk:</span>{' '}
            <span className="text-gray-600">
              {response?.ip_address?.risk ?? 'N/A'}
            </span>
          </div>
        </div>
      </Card>

      {/* IP Anonymity Flags */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">IP Anonymity Flags</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Is Anonymous:</span>{' '}
            <span className="text-gray-600">
              {(response?.ip_address?.traits?.is_anonymous ?? false)
                ? 'Yes'
                : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Is Anonymous VPN:</span>{' '}
            <span className="text-gray-600">
              {(response?.ip_address?.traits?.is_anonymous_vpn ?? false)
                ? 'Yes'
                : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Is Hosting Provider:</span>{' '}
            <span className="text-gray-600">
              {(response?.ip_address?.traits?.is_hosting_provider ?? false)
                ? 'Yes'
                : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Is Public Proxy:</span>{' '}
            <span className="text-gray-600">
              {(response?.ip_address?.traits?.is_public_proxy ?? false)
                ? 'Yes'
                : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Is Residential Proxy:</span>{' '}
            <span className="text-gray-600">
              {(response?.ip_address?.traits?.is_residential_proxy ?? false)
                ? 'Yes'
                : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Is Tor Exit Node:</span>{' '}
            <span className="text-gray-600">
              {(response?.ip_address?.traits?.is_tor_exit_node ?? false)
                ? 'Yes'
                : 'No'}
            </span>
          </div>
        </div>
      </Card>

      {/* Email Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Email Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="font-medium">Email Address:</span>{' '}
            <span className="text-gray-600">N/A</span>
          </div>
          <div>
            <span className="font-medium">Email Domain:</span>{' '}
            <span className="text-gray-600">N/A</span>
          </div>
          <div>
            <span className="font-medium">Domain First Seen:</span>{' '}
            <span className="text-gray-600">
              {response?.email?.domain?.first_seen ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Domain Risk:</span>{' '}
            <span className="text-gray-600">
              {response?.email?.domain?.risk ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Domain Volume:</span>{' '}
            <span className="text-gray-600">
              {response?.email?.domain?.volume ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Email First Seen:</span>{' '}
            <span className="text-gray-600">
              {response?.email?.first_seen ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Email Is Free:</span>{' '}
            <span className="text-gray-600">
              {(response?.email?.is_free ?? false) ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Email Is Disposable:</span>{' '}
            <span className="text-gray-600">
              {(response?.email?.is_disposable ?? false) ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Email Is High Risk:</span>{' '}
            <span className="text-gray-600">
              {(response?.email?.is_high_risk ?? false) ? 'Yes' : 'No'}
            </span>
          </div>
          <div>
            <span className="font-medium">Email Confidence:</span>{' '}
            <span className="text-gray-600">
              {response?.email?.confidence ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Email Risk:</span>{' '}
            <span className="text-gray-600">
              {response?.email?.risk ?? 'N/A'}
            </span>
          </div>
        </div>
      </Card>

      {/* Billing Address Verification */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Billing Address Verification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <div>
            <span className="font-medium">
              Billing postal code is in the city:
            </span>{' '}
            <span className="text-gray-600">
              {formatOptionalBool(billingAddress?.is_postal_in_city)}
            </span>
          </div> */}
          <div>
            <span className="font-medium">Billing postal code latitude:</span>{' '}
            <span className="text-gray-600">
              {billingAddress?.latitude ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Billing postal code longitude:</span>{' '}
            <span className="text-gray-600">
              {billingAddress?.longitude ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">
              Billing postal code to IP address distance (kilometers):
            </span>{' '}
            <span className="text-gray-600">
              {billingAddress?.distance_to_ip_location ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">
              Billing address is in IP country:
            </span>{' '}
            <span className="text-gray-600">
              {formatOptionalBool(billingAddress?.is_in_ip_country)}
            </span>
          </div>
        </div>
      </Card>

      {/* Shipping Address Verification */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Shipping Address Verification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <div>
            <span className="font-medium">
              Shipping postal code is in the shipping city:
            </span>{' '}
            <span className="text-gray-600">
              {formatOptionalBool(shippingAddress?.is_postal_in_city)}
            </span>
          </div> */}
          <div>
            <span className="font-medium">Shipping postal code latitude:</span>{' '}
            <span className="text-gray-600">
              {shippingAddress?.latitude ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Shipping postal code longitude:</span>{' '}
            <span className="text-gray-600">
              {shippingAddress?.longitude ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">
              Shipping postal code to IP address distance (kilometers):
            </span>{' '}
            <span className="text-gray-600">
              {shippingAddress?.distance_to_ip_location ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">
              Shipping address is in IP country:
            </span>{' '}
            <span className="text-gray-600">
              {formatOptionalBool(shippingAddress?.is_in_ip_country)}
            </span>
          </div>
          <div>
            <span className="font-medium">
              Shipping address to billing address distance (kilometers):
            </span>{' '}
            <span className="text-gray-600">
              {shippingAddress?.distance_to_billing_address ?? 'N/A'}
            </span>
          </div>
        </div>
      </Card>

      {/* Phone Analysis */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Phone Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* <div>
            <span className="font-medium">Billing Phone Number:</span>{' '}
            <span className="text-gray-600">N/A</span>
          </div> */}
          <div>
            <span className="font-medium">Billing Phone Country:</span>{' '}
            <span className="text-gray-600">
              {response?.billing_phone?.country ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Billing Phone Type:</span>{' '}
            <span className="text-gray-600">
              {response?.billing_phone?.number_type ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Billing Phone Is Valid:</span>{' '}
            <span className="text-gray-600">
              {formatOptionalBool(response?.billing_phone?.is_valid)}
            </span>
          </div>
          {/* <div>
            <span className="font-medium">Shipping Phone Number:</span>{' '}
            <span className="text-gray-600">N/A</span>
          </div> */}
          <div>
            <span className="font-medium">Shipping Phone Country:</span>{' '}
            <span className="text-gray-600">
              {response?.shipping_phone?.country ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Shipping Phone Type:</span>{' '}
            <span className="text-gray-600">
              {response?.shipping_phone?.number_type ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Shipping Phone Is Valid:</span>{' '}
            <span className="text-gray-600">
              {formatOptionalBool(response?.shipping_phone?.is_valid)}
            </span>
          </div>
          <div>
            <span className="font-medium">Shipping Phone Operator:</span>{' '}
            <span className="text-gray-600">
              {response?.shipping_phone?.network_operator ?? 'N/A'}
            </span>
          </div>
          <div>
            <span className="font-medium">Shipping Phone Is VOIP:</span>{' '}
            <span className="text-gray-600">
              {formatOptionalBool(response?.shipping_phone?.is_voip)}
            </span>
          </div>
        </div>
      </Card>

      {/* Warnings */}
      {response?.warnings && response.warnings.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Warnings</h3>
          <div className="space-y-2">
            {response.warnings.map((warning, index) => (
              <div
                key={index}
                className="text-sm text-yellow-600 border-l-4 border-yellow-400 pl-3 py-1"
              >
                <p className="font-medium">{warning.code}</p>
                <p className="text-gray-600">{warning.warning}</p>
                {warning.input_pointer && (
                  <p className="text-xs text-gray-500 mt-1">
                    Field: {warning.input_pointer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
